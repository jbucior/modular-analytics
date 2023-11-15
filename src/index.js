// @ts-check
import analyticModules from './modules';

const globalProperties = {};

/**
 * @type {import('./main').IAnalytics}
 */
export const Analytics = {
  /**
   * @param {import("./main").InitializeParams} options
   */
  async initialize(options) {
    await Promise.all(analyticModules
      .map(async (analyticModule) => analyticModule.initialize
      && analyticModule.initialize(options)));
  },

  /**
   * @param {string} eventName
   * @param {object} properties
   * @param {Array} modules
   */
  trackEvent(eventName, properties, modules) {
    const responses = analyticModules.map((analyticModule) => {
      if (analyticModule.name !== 'debug') {
        const moduleRegistered = modules && modules.includes(analyticModule.name);
        const hasTrackEvent = ('trackEvent' in analyticModule);

        if (!moduleRegistered || !hasTrackEvent) return [];  
      }
      
      return analyticModule.trackEvent(eventName, { ...globalProperties, ...properties });
    }).flat();

    return Promise.all(responses);
  },

  /**
   * @param {string|object} property
   * @param {Record<string, unknown> | string} value
   */
  setGlobalProperties(property, value) {
    console.log('property: ', property);
    console.log('value: ', value);
    if (typeof property === 'object') {
      Object.assign(globalProperties, property);
    } else if (typeof property === 'string') {
      globalProperties[property] = value;
    }
  },
};

export default Analytics;
