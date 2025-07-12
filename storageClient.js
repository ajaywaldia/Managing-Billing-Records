const axios = require('axios');
const Storage = require('./storage');
const AuthClient = require('./authClient');
const Context = require('./context'); // Your logging abstraction
const { performance } = require('perf_hooks');

class AzureTableClient {
  constructor(projectId) {
    this.projectId = projectId;
  }

  async loadEntityAsync(key) {
    Context.Logger.info({}, 'Before fetching table service');
    const tableService = await this.getTableServiceAsync(); // returns storageAccountName, storageEndpointSuffix, storageApiVersion
    const timestamp = new Date().toUTCString();
    const auth = await AuthClient.Get(this.projectId);

    Context.Logger.info({}, 'Auth client set');
    const sasToken = await Storage.GenerateSasTokenIfExpired(
      this.projectId,
      tableService.storageAccountName,
      auth
    );

    const encodedUriPath = `${key.Path[0].Kind}(PartitionKey='${key.Namespace}', RowKey='${key.Path[0].Name}')${sasToken}`;
    const endPoint = `https://${tableService.storageAccountName}.table.${tableService.storageEndpointSuffix}/${encodedUriPath}`;

    const config = {
      method: 'get',
      url: endPoint,
      timeout: Context.DefaultAxiosRequestTimeoutSeconds,
      headers: {
        'x-ms-date': timestamp,
        'x-ms-version': tableService.storageApiVersion,
        'Accept': 'application/json',
        'Prefer': 'return-content'
      }
    };

    const axiosInstance = require('./axiosClient').getAxiosInstanceWithTimeoutConfig(Context.Logger);
    try {
      const start = performance.now();
      const response = await axiosInstance(config);
      const end = performance.now();
      const opTime = Math.round((end - start) / 1000);

      Context.Logger.info({ project: this.projectId, storageAcc: tableService.storageAccountName },
        `get table data took ${opTime} seconds: Timestamp: ${new Date()}`);

      const result = require('./datastoreService').ConvertFromAzureRestData(
        require('./datastoreService').GetAzureTable(key),
        response.data
      );

      return result;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }

      if (error.response?.data['odata.error']) {
        Context.Logger.error({ err: error.response.data }, 'Error while loading data from azure table storage');
        throw require('./odataErrorUtil').ODataToError(error.response.data['odata.error']);
      }

      Context.Logger.error({ err: error.message }, 'Generic error while loading data from azure table storage');
      throw error.response?.data?.error || error;
    }
  }

  async getTableServiceAsync() {
    // Return mocked or real service info
    return {
      storageAccountName: process.env.STORAGE_ACCOUNT_NAME,
      storageEndpointSuffix: 'core.windows.net',
      storageApiVersion: '2019-02-02'
    };
  }
}

module.exports = AzureTableClient;
