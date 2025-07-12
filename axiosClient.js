
function getAxiosInstanceWithTimeoutConfig(logger) {
  const instance = axios.create({
    timeout: process.env.AXIOS_TIMEOUT_MS || 5000,
  });

  instance.interceptors.response.use(
    (response) => {
      if (logger) logger.info({ url: response.config.url }, 'Axios response received');
      return response;
    },
    (error) => {
      if (logger) logger.error({ err: error.message }, 'Axios request failed');
      return Promise.reject(error);
    }
  );

module.export = getAxiosInstanceWithTimeoutConfig;
