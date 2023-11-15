/* global __analytics */
// Note there has been special combination of if statement applied here so the unused code can be eliminated
// during dead code elimination process, while editing/refactoring this file please take care,
// so that the elimination process still works.
// Also note that each analytics cannot be split into separate files, as it will break code elimination.
const names = {
  DEBUG: 'debug',
  INFERMEDICA_ANALYTICS: 'infermedicaAnalytics',
};
const analyticModules = [];

const filterProperties = (properties, allowProperties = [], disallowProperties = []) => Object.keys(
  properties,
)
  .filter(
    (key) => (allowProperties.length < 1 || allowProperties.includes(key)),
  )
  .filter((key) => (disallowProperties.length < 1
    || !disallowProperties.includes(key)))
  .reduce((object, key) => ({ ...object, [key]: properties[key] }), {});

// --- Debug module ---
/* eslint-disable no-console */
function debugModule() {
  console.log('Analytics (initialization)');

  return {
    name: names.DEBUG,
    trackEvent(eventName, properties) {
      console.log('Analytics (trackEvent):', eventName, properties);
      return new Promise((resolve) => resolve(200))
    },
  };
}

if (__analytics.debug.isEnabled) analyticModules.push(debugModule());
/* eslint-enable */

// --- Infermedica Analytics ---
function infermedicaModule() {
  const {
    appId,
    environment,
    baseURL = 'https://analytics-proxy.infermedica.com/',
    publishURL = '/api/v1/publish',
  } = __analytics.infermedicaAnalytics;

  const headers = { 'infer-application-id': appId };
  let analyticsApi = null;
  let userAgentInfo = null;
  let auth = null;
  let eventQueue = [];

  const publish = async (data) => {
    const attributes = {
      environment,
    };
    const { topic, ...rest } = data;
    const events = [
      {
        data: rest,
        attributes,
      },
    ];
    const payload = {
      topic: topic || __analytics.infermedicaAnalytics.topic,
      events,
    };

    return analyticsApi.post(publishURL, payload);
  };

  const initializeUserAgentInfo = async () => {
    if (userAgentInfo === null) {
      const { default: UAParser } = await import('ua-parser-js');
      userAgentInfo = UAParser();
    }
    return Promise.resolve(userAgentInfo);
  };

  const initializeAxios = async () => {
    if (analyticsApi === null) {
      const { default: axios } = await import('axios');

      analyticsApi = axios.create({
        baseURL,
        headers,
      });
    }
  };

  return {
    name: names.INFERMEDICA_ANALYTICS,
    /**
       * @param {import('./main').InitializeParams} options
       */
    initialize: async (options = {}) => {
      await Promise.all([initializeAxios(), initializeUserAgentInfo()]);
    },
    /**
       * @param { string } eventName
       * @param { object } properties
       */
    async trackEvent(eventName, properties) {
      // prevent to send event without event_details
      if (!properties.event_details) {
        return;
      }
      await Promise.all([initializeAxios(), initializeUserAgentInfo()]);
      const allowProperties = __analytics.infermedicaAnalytics?.allowProperties;
      const disallowProperties = __analytics.infermedicaAnalytics?.disallowProperties;
      const filteredProperties = filterProperties(
        properties,
        allowProperties,
        disallowProperties,
      );
      const date = new Date();
      const { user, application } = filteredProperties;

      const {
        browser, os, device: platform, ua: user_agent, // eslint-disable-line camelcase
      } = userAgentInfo;

      const userAgentInfoWithFallback = {
        browser: {
          ...browser,
          name: browser.name ?? '',
          version: browser.version ?? '',
        },
        os: {
          ...os,
          name: os.name ?? '',
        },
        platform: {
          ...platform,
          // Providing 'desktop' as default type value as ua-parser-js adds device.type only when explicitly defined in UA, e.g. 'Mobile Safari'
          // More context - https://github.com/faisalman/ua-parser-js/issues/182#issuecomment-263115448
          type: platform.type ?? 'desktop',
        },
        user_agent, // eslint-disable-line camelcase
      };

      const data = {
        ...filteredProperties,
        date,
        application: {
          ...application,
        },
        user: {
          ...user,
          ...userAgentInfoWithFallback,
        },
        event_details: {
          event_type: '',
          event_object: '',
          event_data: {
            type: '',
            data: [],
          },
          ...filteredProperties.event_details,
        },
      };

      // eslint-disable-next-line consistent-return
      return publish(data);
    },
  };
}
if (__analytics.infermedicaAnalytics.isEnabled) analyticModules.push(infermedicaModule());

export default analyticModules;
