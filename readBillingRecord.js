
const AzureTableClient = require('./azureTableClient');
const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
  const { id, partitionKey } = req.query;
  if (!id || !partitionKey) {
    context.res = { status: 400, body: 'Missing id or partitionKey' };
    return;
  }

  const projectId = process.env.PROJECT_ID;
  const tableClient = new AzureTableClient(projectId);

  const key = {
    Namespace: partitionKey,
    Path: [{ Kind: process.env.TABLE_NAME || 'BillingTable', Name: id }]
  };

  let entity = null;

  try {
    entity = await tableClient.loadEntityAsync(key);
  } catch (error) {
    throw error;
  }

  if (entity) {
    context.res = {
      status: 200,
      body: entity,
      headers: { 'Content-Type': 'application/json' }
    };
    return;
  }

  // send to Blob
  const blobName = `${partitionKey}_${id}.json`;
  const blobClient = BlobServiceClient.fromConnectionString(process.env.AZURE_BLOB_CONN).getContainerClient('billing-archive').getBlobClient(blobName);

  try {
    if (!(await blobClient.exists())) {
      context.res = { status: 404, body: 'Record not found in Table or Blob' };
      return;
    }

    const downloadBlockBlobResponse = await blobClient.download();
    const stream = downloadBlockBlobResponse.readableStreamBody;
    const data = await streamToBuffer(stream);

    context.res = {
      status: 200,
      body: data.toString(),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    context.res = { status: 500, body: 'Internal Server Error' };
  }
};

// Helper to read from stream
function streamToBuffer(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', chunk => chunks.push(chunk));
    readableStream.on('end', () => resolve(Buffer.concat(chunks)));
    readableStream.on('error', reject);
  });
}
