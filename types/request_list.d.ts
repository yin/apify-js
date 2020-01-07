export const STATE_PERSISTENCE_KEY: "REQUEST_LIST_STATE";
export const SOURCES_PERSISTENCE_KEY: "REQUEST_LIST_SOURCES";
/**
 * Represents a static list of URLs to crawl.
 * The URLs can be provided either in code or parsed from a text file hosted on the web.
 *
 * Each URL is represented using an instance of the {@link Request} class.
 * The list can only contain unique URLs. More precisely, it can only contain `Request` instances
 * with distinct `uniqueKey` properties. By default, `uniqueKey` is generated from the URL, but it can also be overridden.
 * To add a single URL to the list multiple times, corresponding {@link Request} objects will need to have different
 * `uniqueKey` properties. You can use the `keepDuplicateUrls` option to do this for you when initializing the
 * `RequestList` from sources.
 *
 * Once you create an instance of `RequestList`, you need to call the {@link RequestList#initialize} function
 * before the instance can be used. After that, no more URLs can be added to the list.
 *
 * `RequestList` is used by {@link BasicCrawler}, {@link CheerioCrawler}
 * and {@link PuppeteerCrawler} as a source of URLs to crawl.
 * Unlike {@link RequestQueue}, `RequestList` is static but it can contain even millions of URLs.
 *
 * `RequestList` has an internal state where it stores information about which requests were already handled,
 * which are in progress and which were reclaimed. The state may be automatically persisted to the default
 * {@link KeyValueStore} by setting the `persistStateKey` option so that if the Node.js process is restarted,
 * the crawling can continue where it left off. The automated persisting is launched upon receiving the `persistState`
 * event that is periodically emitted by {@link events|Apify.events}.
 *
 * The internal state is closely tied to the provided sources (URLs). If the sources change on actor restart, the state will become corrupted and
 * `RequestList` will raise an exception. This typically happens when the sources is a list of URLs downloaded from the web.
 * In such case, use the `persistSourcesKey` option in conjunction with `persistStateKey`,
 * to make the `RequestList` store the initial sources to the default key-value store and load them after restart,
 * which will prevent any issues that a live list of URLs might cause.
 *
 * **Example usage:**
 *
 * ```javascript
 * const requestList = new Apify.RequestList({
 *     sources: [
 *         // Separate requests
 *         { url: 'http://www.example.com/page-1', method: 'GET', headers: {} },
 *         { url: 'http://www.example.com/page-2', userData: { foo: 'bar' }},
 *
 *         // Bulk load of URLs from file `http://www.example.com/my-url-list.txt`
 *         // Note that all URLs must start with http:// or https://
 *         { requestsFromUrl: 'http://www.example.com/my-url-list.txt', userData: { isFromUrl: true } },
 *     ],
 *
 *     // Ensure both the sources and crawling state of the request list is persisted,
 *     // so that on actor restart, the crawling will continue where it left off
 *     persistStateKey: 'my-state',
 *     persistSourcesKey: 'my-sources'
 * });
 *
 * // This call loads and parses the URLs from the remote file.
 * await requestList.initialize();
 *
 * // Get requests from list
 * const request1 = await requestList.fetchNextRequest();
 * const request2 = await requestList.fetchNextRequest();
 * const request3 = await requestList.fetchNextRequest();
 *
 * // Mark some of them as handled
 * await requestList.markRequestHandled(request1);
 *
 * // If processing fails then reclaim it back to the list
 * await requestList.reclaimRequest(request2);
 * ```
 *
 * @param {Object} options All `RequestList` parameters are passed
 *   via an options object with the following keys:
 * @param {Array} options.sources
 *  An array of sources of URLs for the `RequestList`. It can be either an array of plain objects that
 *  define the `url` property, or an array of instances of the {@link Request} class.
 *  Additionally, the `requestsFromUrl` property may be used instead of `url`,
 *  which will instruct `RequestList` to download the source URLs from a given remote location.
 *  The URLs will be parsed from the received response.
 *
 * ```
 * [
 *     // One URL
 *     { method: 'GET', url: 'http://example.com/a/b' },
 *     // Batch import of URLs from a file hosted on the web
 *     { method: 'POST', requestsFromUrl: 'http://example.com/urls.txt' },
 *     // Batch import combined with regex.
 *     { method: 'POST', requestsFromUrl: 'http://example.com/urls.txt', regex: /https:\/\/example.com\/.+/ },
 * ]
 * ```
 * @param {String} [options.persistStateKey]
 *   Identifies the key in the default key-value store under which `RequestList` periodically stores its
 *   state (i.e. which URLs were crawled and which not).
 *   If the actor is restarted, `RequestList` will read the state
 *   and continue where it left off.
 *
 *   If `persistStateKey` is not set, `RequestList` will always start from the beginning,
 *   and all the source URLs will be crawled again.
 * @param {String} [options.persistSourcesKey]
 *   Identifies the key in the default key-value store under which the `RequestList` persists its
 *   sources (i.e. the lists of URLs) during the {@link RequestList#initialize} call.
 *   This is necessary if `persistStateKey` is set and the source URLs might potentially change,
 *   to ensure consistency of the source URLs and state object. However, it comes with some storage and performance overheads.
 *
 *   If `persistSourcesKey` is not set, {@link RequestList#initialize} will always fetch the sources
 *   from their origin, check that they are consistent with the restored state (if any)
 *   and throw an error if they are not.
 * @param {Object} [options.state]
 *   The state object that the `RequestList` will be initialized from.
 *   It is in the form as returned by `RequestList.getState()`, such as follows:
 *
 * ```
 * {
 *     nextIndex: 5,
 *     nextUniqueKey: 'unique-key-5'
 *     inProgress: {
 *         'unique-key-1': true,
 *         'unique-key-4': true,
 *     },
 * }
 * ```
 *
 *   Note that the preferred (and simpler) way to persist the state of crawling of the `RequestList`
 *   is to use the `stateKeyPrefix` parameter instead.
 * @param {Boolean} [options.keepDuplicateUrls=false]
 *   By default, `RequestList` will deduplicate the provided URLs. Default deduplication is based
 *   on the `uniqueKey` property of passed source {@link Request} objects.
 *
 *   If the property is not present, it is generated by normalizing the URL. If present, it is kept intact.
 *   In any case, only one request per `uniqueKey` is added to the `RequestList` resulting in removal
 *   of duplicate URLs / unique keys.
 *
 *   Setting `keepDuplicateUrls` to `true` will append an additional identifier to the `uniqueKey`
 *   of each request that does not already include a `uniqueKey`. Therefore, duplicate
 *   URLs will be kept in the list. It does not protect the user from having duplicates in user set
 *   `uniqueKey`s however. It is the user's responsibility to ensure uniqueness of their unique keys
 *   if they wish to keep more than just a single copy in the `RequestList`.
 */
export class RequestList {
    constructor(options?: {});
    requests: any[];
    nextIndex: number;
    uniqueKeyToIndex: {};
    inProgress: {};
    reclaimed: {};
    persistStateKey: any;
    persistSourcesKey: any;
    initialState: any;
    keepDuplicateUrls: any;
    isStatePersisted: boolean;
    areSourcesPersisted: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    sources: any;
    /**
     * Loads all remote sources of URLs and potentially starts periodic state persistence.
     * This function must be called before you can start using the instance in a meaningful way.
     *
     * @returns {Promise}
     */
    initialize(): Promise<any>;
    /**
     * Persists the current state of the `RequestList` into the default {@link KeyValueStore}.
     * The state is persisted automatically in regular intervals, but calling this method manually
     * is useful in cases where you want to have the most current state available after you pause
     * or stop fetching its requests. For example after you pause or abort a crawl. Or just before
     * a server migration.
     *
     * @return {Promise}
     */
    persistState(): Promise<any>;
    /**
     * Unlike persistState(), this is used only internally, since the sources
     * are automatically persisted at RequestList initialization (if the persistSourcesKey is set),
     * but there's no reason to persist it again afterwards, because RequestList is immutable.
     *
     * @return {Promise}
     * @ignore
     */
    _persistSources(): Promise<any>;
    /**
     * Restores RequestList state from a state object.
     *
     * @param {Object} state
     * @ignore
     */
    _restoreState(state: any): void;
    /**
     * Attempts to load state and sources using the `RequestList` configuration
     * and returns a tuple of [state, sources] where each may be null if not loaded.
     *
     * @return {Promise<Array>}
     * @ignore
     */
    _loadStateAndSources(): Promise<any[]>;
    /**
     * Returns an object representing the internal state of the `RequestList` instance.
     * Note that the object's fields can change in future releases.
     *
     * @returns {Object}
     */
    getState(): any;
    /**
     * Resolves to `true` if the next call to {@link RequestList#fetchNextRequest} function
     * would return `null`, otherwise it resolves to `false`.
     * Note that even if the list is empty, there might be some pending requests currently being processed.
     *
     * @returns {Promise<Boolean>}
     */
    isEmpty(): Promise<boolean>;
    /**
     * Returns `true` if all requests were already handled and there are no more left.
     *
     * @returns {Promise<Boolean>}
     */
    isFinished(): Promise<boolean>;
    /**
     * Gets the next {@link Request} to process. First, the function gets a request previously reclaimed
     * using the {@link RequestList#reclaimRequest} function, if there is any.
     * Otherwise it gets the next request from sources.
     *
     * The function's `Promise` resolves to `null` if there are no more
     * requests to process.
     *
     * @returns {Promise<Request>}
     */
    fetchNextRequest(): Promise<Request>;
    /**
     * Marks request as handled after successful processing.
     *
     * @param {Request} request
     *
     * @returns {Promise}
     */
    markRequestHandled(request: Request): Promise<any>;
    /**
     * Reclaims request to the list if its processing failed.
     * The request will become available in the next `this.fetchNextRequest()`.
     *
     * @param {Request} request
     *
     * @returns {Promise}
     */
    reclaimRequest(request: Request): Promise<any>;
    /**
     * Adds all fetched requests from a URL from a remote resource.
     *
     * @ignore
     */
    _addFetchedRequests(source: any, fetchedRequests: any): Promise<void>;
    /**
     * Fetches URLs from requestsFromUrl and returns them in format of list of requests
     * @param source
     * @return {Promise<Object[]|Array>}
     * @ignore
     */
    _fetchRequestsFromUrl(source: any): Promise<any[]>;
    /**
     * Adds given request.
     * If the `opts` parameter is a plain object and not an instance of a `Request`, then the function
     * creates a `Request` instance.
     *
     * @ignore
     */
    _addRequest(opts: any): void;
    /**
     * Helper function that validates unique key.
     * Throws an error if uniqueKey is not a non-empty string.
     *
     * @ignore
     */
    _ensureUniqueKeyValid(uniqueKey: any): void;
    /**
     * Checks that request is not reclaimed and throws an error if so.
     *
     * @ignore
     */
    _ensureInProgressAndNotReclaimed(uniqueKey: any): void;
    /**
     * Throws an error if request list wasn't initialized.
     *
     * @ignore
     */
    _ensureIsInitialized(): void;
    /**
     * Returns the total number of unique requests present in the `RequestList`.
     *
     * @returns {Number}
     */
    length(): number;
    /**
     * Returns number of handled requests.
     *
     * @returns {Number}
     */
    handledCount(): number;
}
export function openRequestList(listName: string, sources: any[] | string[], options?: any): Promise<RequestList>;
import Request from "./request";