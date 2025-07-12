
const axios = require('axios');
const Storage = require('./storage');
const AuthClient = require('./authClient');
const { performance } = require('perf_hooks');

class AzureTableClient {
  constructor(projectId) {
    this.projectId = projectId;
  }

  async getTableServiceAsync() {
    return {
      storageAccountName: process.env.STORAGE_ACCOUNT_NAME,
      storageEndpointSuffix: 'core.windows.net',
      storageApiVersion: '2019-02-02'
    };
  }

  async loadEntityAsync(key) {
    const tableService = await this.getTableServiceAsync(); // gives the storageAccountName, storageEndpointSuffix, storageApiVersion
    const timestamp = new Date().toUTCString();
    const auth = await AuthClient.Get(this.projectId);
    const sasToken = await Storage.GenerateSasTokenIfExpired(
      this.projectId,
      tableService.storageAccountName,
      auth
    );                                             // One of the way using token using which we can access the entity

    const encodedUriPath = `${key.Path[0].Kind}(PartitionKey='${key.Namespace}', RowKey='${key.Path[0].Name}')${sasToken}`;
    const endPoint = `https://${tableService.storageAccountName}.table.${tableService.storageEndpointSuffix}/${encodedUriPath}`;

    const config = {
      method: 'get',
      url: endPoint,
      timeout:<Some TimeOut>,
      headers: {
        'x-ms-date': timestamp,
        'x-ms-version': tableService.storageApiVersion,
        'Accept': 'application/json',
        'Prefer': 'return-content'
      }
    };

    const axiosInstance = require('./axiosClient').getAxiosInstanceWithTimeoutConfig();
    try {
      const start = performance.now();
      const response = await axiosInstance(config);
      const end = performance.now();
      const result = require('./datastoreService').ConvertFromAzureRestData(require('./datastoreService').GetAzureTable(key),response.data);
      return result;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
    }
  }

}

module.exports = AzureTableClient;
