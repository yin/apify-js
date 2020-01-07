export const BROWSER_SESSION_KEY_NAME: "APIFY_SESSION";
export default PuppeteerPool;
/**
 * Manages a pool of Chrome browser instances controlled using
 * <a href="https://github.com/GoogleChrome/puppeteer" target="_blank">Puppeteer</a>.
 *
 * `PuppeteerPool` reuses Chrome instances and tabs using specific browser rotation and retirement policies.
 * This is useful in order to facilitate rotation of proxies, cookies
 * or other settings in order to prevent detection of your web scraping bot,
 * access web pages from various countries etc.
 *
 * Additionally, the reuse of browser instances instances speeds up crawling,
 * and the retirement of instances helps mitigate effects of memory leaks in Chrome.
 *
 * `PuppeteerPool` is internally used by the {@link PuppeteerCrawler} class.
 *
 * **Example usage:**
 *
 * ```javascript
 * const puppeteerPool = new PuppeteerPool({
 *   launchPuppeteerFunction: () => {
 *     // Use a new proxy with a new IP address for each new Chrome instance
 *     return Apify.launchPuppeteer({
 *        useApifyProxy: true,
 *        apifyProxySession: Math.random(),
 *     });
 *   },
 * });
 *
 * const page1 = await puppeteerPool.newPage();
 * const page2 = await puppeteerPool.newPage();
 * const page3 = await puppeteerPool.newPage();
 *
 * // ... do something with the pages ...
 *
 * // Close all browsers.
 * await puppeteerPool.destroy();
 * ```
 * @param {Object} [options]
 *   All `PuppeteerPool` parameters are passed
 *   via an options object with the following keys:
 * @param {boolean} [options.useLiveView]
 *   Enables the use of a preconfigured {@link LiveViewServer} that serves snapshots
 *   just before a page would be recycled by `PuppeteerPool`. If there are no clients
 *   connected, it has close to zero impact on performance.
 * @param {number} [options.maxOpenPagesPerInstance=50]
 *   Maximum number of open pages (i.e. tabs) per browser. When this limit is reached, new pages are loaded in a new browser instance.
 * @param {number} [options.retireInstanceAfterRequestCount=100]
 *   Maximum number of requests that can be processed by a single browser instance.
 *   After the limit is reached, the browser is retired and new requests are
 *   handled by a new browser instance.
 * @param {number} [options.puppeteerOperationTimeoutSecs=15]
 *   All browser management operations such as launching a new browser, opening a new page
 *   or closing a page will timeout after the set number of seconds and the connected
 *   browser will be retired.
 * @param {number} [options.instanceKillerIntervalSecs=60]
 *   Indicates how often are the open Puppeteer instances checked whether they can be closed.
 * @param {number} [options.killInstanceAfterSecs=300]
 *   When Puppeteer instance reaches the `options.retireInstanceAfterRequestCount` limit then
 *   it is considered retired and no more tabs will be opened. After the last tab is closed the
 *   whole browser is closed too. This parameter defines a time limit between the last tab was opened and
 *   before the browser is closed even if there are pending open tabs.
 * @param {Function} [options.launchPuppeteerFunction]
 *   Overrides the default function to launch a new Puppeteer instance.
 *   The function must return a promise resolving to
 *   [`Browser`](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-browser) instance.
 *   See the source code on
 *   <a href="https://github.com/apifytech/apify-js/blob/master/src/puppeteer_pool.js#L28" target="_blank">GitHub</a>
 *   for the default implementation.
 * @param {LaunchPuppeteerOptions} [options.launchPuppeteerOptions]
 *   Options used by `Apify.launchPuppeteer()` to start new Puppeteer instances.
 *   See [`LaunchPuppeteerOptions`](../typedefs/launchpuppeteeroptions).
 * @param {boolean} [options.recycleDiskCache=false]
 *   Enables recycling of disk cache directories by Chrome instances.
 *   When a browser instance is closed, its disk cache directory is not deleted but it's used by a newly opened browser instance.
 *   This is useful to reduce amount of data that needs to be downloaded to speed up crawling and reduce proxy usage.
 *   Note that the new browser starts with empty cookies, local storage etc. so this setting doesn't affect anonymity of your crawler.
 *
 *   Beware that the disk cache directories can consume a lot of disk space.
 *   To limit the space consumed, you can pass the `--disk-cache-size=X` argument to `options.launchPuppeteerOptions.args`,
 *   where `X` is the approximate maximum number of bytes for disk cache.
 *
 *   Do not use the `options.recycleDiskCache` setting together with `--disk-cache-dir`
 *   argument in `options.launchPuppeteerOptions.args`, the behavior is undefined.
 * @param {boolean} [options.useIncognitoPages]
 *   With this option selected, all pages will be opened in a new incognito browser context, which means
 *   that they will not share cookies or cache and their resources will not be throttled by one another.
 * @param {string[]} [options.proxyUrls]
 *   An array of custom proxy URLs to be used by the `PuppeteerPool` instance.
 *   The provided custom proxies' order will be randomized and the resulting list rotated.
 *   Custom proxies are not compatible with Apify Proxy and an attempt to use both
 *   configuration options will cause an error to be thrown on startup.
 */
declare class PuppeteerPool {
    constructor(options?: {});
    sessionPool: any;
    reusePages: boolean;
    maxOpenPagesPerInstance: any;
    retireInstanceAfterRequestCount: any;
    puppeteerOperationTimeoutMillis: number;
    killInstanceAfterMillis: any;
    recycledDiskCacheDirs: any;
    useIncognitoPages: any;
    proxyUrls: any;
    liveViewServer: LiveViewServer;
    launchPuppeteerFunction: () => Promise<any>;
    browserCounter: number;
    activeInstances: {};
    retiredInstances: {};
    lastUsedProxyUrlIndex: number;
    instanceKillerInterval: NodeJS.Timeout;
    idlePages: any[];
    closedPages: WeakSet<object>;
    pagesToInstancesMap: WeakMap<object, any>;
    liveViewSnapshotsInProgress: WeakMap<object, any>;
    sigintListener: () => void;
    _retireBrowserWithSession(session: any): Promise<void>;
    /**
     * Launches new browser instance.
     *
     * @ignore
     */
    _launchInstance(): PuppeteerInstance;
    /**
     * Takes care of async processes in PuppeteerInstance construction with a Browser.
     * @param {Promise<Browser>} browserPromise
     * @param {PuppeteerInstance} instance
     * @returns {Promise}
     * @ignore
     */
    _initBrowser(browserPromise: Promise<any>, instance: PuppeteerInstance): Promise<any>;
    /**
     * Retires some of the instances for example due to many uses.
     *
     * @ignore
     */
    _retireInstance(instance: any): any;
    /**
     * Kills all the retired instances that:
     * - have all tabs closed
     * - or are inactive for more then killInstanceAfterMillis.
     *
     * @ignore
     */
    _killRetiredInstances(): void;
    /**
     * Kills given browser instance.
     *
     * @ignore
     */
    _killInstance(instance: any): Promise<void>;
    /**
     * Kills all running PuppeteerInstances.
     * @ignore
     */
    _killAllInstances(): void;
    /**
     * Updates the instance metadata when a new page is opened.
     *
     * @param {PuppeteerInstance} instance
     * @ignore
     */
    _incrementPageCount(instance: PuppeteerInstance): void;
    /**
     * Produces a new page instance either by reusing an idle page that currently isn't processing
     * any request or by spawning a new page (new browser tab) in one of the available
     * browsers when no idle pages are available.
     *
     * To spawn a new browser tab for each page, set the `reusePages` constructor option to false.
     *
     * @return {Promise<Page>}
     */
    newPage(): Promise<any>;
    /**
     * Opens new tab in one of the browsers in the pool and returns a `Promise`
     * that resolves to an instance of a Puppeteer
     * <a href="https://pptr.dev/#?product=Puppeteer&show=api-class-page" target="_blank"><code>Page</code></a>.
     *
     * @return {Promise<Page>}
     * @ignore
     */
    _openNewTab(): Promise<any>;
    /**
     * Adds the necessary boilerplate to allow page reuse and also
     * captures page.close() errors to prevent meaningless log clutter.
     * @param {Page} page
     * @ignore
     */
    _decoratePage(page: any): any;
    /**
     * Tells Chromium to focus oldest tab. This is to work around Chromium
     * throttling CPU and network in inactive tabs.
     *
     * @param {Browser} browser
     * @ignore
     */
    _focusOldestTab(browser: any): Promise<any>;
    /**
     * Closes all open browsers.
     * @return {Promise}
     */
    destroy(): Promise<any>;
    /**
     * Finds a PuppeteerInstance given a Puppeteer Browser running in the instance.
     * @param {Browser} browser
     * @return {Promise}
     * @ignore
     */
    _findInstanceByBrowser(browser: any): Promise<any>;
    /**
     * Manually retires a Puppeteer
     * <a href="https://pptr.dev/#?product=Puppeteer&show=api-class-browser" target="_blank"><code>Browser</code></a>
     * instance from the pool. The browser will continue to process open pages so that they may gracefully finish.
     * This is unlike `browser.close()` which will forcibly terminate the browser and all open pages will be closed.
     * @param {Browser} browser
     * @return {Promise}
     */
    retire(browser: any): Promise<any>;
    /**
     * Closes the page, unless the `reuseTabs` option is set to true.
     * Then it would only flag the page for a future reuse, without actually closing it.
     *
     * NOTE: LiveView snapshotting is tied to this function. When `useLiveView` option
     * is set to true, a snapshot of the page will be taken just before closing the page
     * or flagging it for reuse.
     *
     * @param {Page} page
     * @return {Promise}
     */
    recyclePage(page: any): Promise<any>;
    /**
     * Tells the connected LiveViewServer to serve a snapshot when available.
     *
     * @param page
     * @return {Promise}
     */
    serveLiveViewSnapshot(page: any): Promise<any>;
    _findInstancesBySession(session: any): any[];
    _killInstanceWithNoPages(instance: any): void;
}
import LiveViewServer from "./live_view/live_view_server";
/**
 * Internal representation of Puppeteer instance.
 *
 * @ignore
 */
declare class PuppeteerInstance {
    constructor(id: any, browserPromise: any);
    id: any;
    activePages: number;
    totalPages: number;
    browserPromise: any;
    lastPageOpenedAt: number;
    killed: boolean;
    childProcess: any;
    recycleDiskCacheDir: any;
}