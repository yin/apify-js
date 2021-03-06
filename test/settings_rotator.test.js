import _ from 'underscore';
import Apify from '../build/index';

describe('Apify.SettingsRotator', () => {
    test('works', async () => {
        const maxUsages = 12;
        const totalCalls = 167;

        const rotator = new Apify.SettingsRotator({
            newSettingsFunction: () => Math.random(),
            maxUsages,
        });

        const settings = _.range(0, totalCalls).map(() => rotator.fetchSettings());

        expect(_.uniq(settings).length).toEqual(Math.ceil(totalCalls / maxUsages));
    });
});
