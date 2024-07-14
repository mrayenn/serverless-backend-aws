console.log('Function starts');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-west-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = 'Products';

exports.handler = async (event, context) => {
  const { httpMethod, queryStringParameters, body } = event;
  const { name } = queryStringParameters || {};
  const { price } = JSON.parse(body || '{}');

  try {
    switch (httpMethod) {
      case 'GET':
        if (name) {
          const result = await dynamodb.get({ TableName: tableName, Key: { name } }).promise();
          return { statusCode: 200, body: JSON.stringify(result.Item || {}) };
        } else {
          const result = await dynamodb.scan({ TableName: tableName }).promise();
          return { statusCode: 200, body: JSON.stringify(result.Items) };
        }

      case 'POST':
        const newItem = { name, price };
        await dynamodb.put({ TableName: tableName, Item: newItem }).promise();
        return { statusCode: 200, body: JSON.stringify(newItem) };

      case 'PUT':
        if (!name) {
          return { statusCode: 400, body: JSON.stringify({ error: 'Missing product name' }) };
        }
        await dynamodb.update({ TableName: tableName, Key: { name }, UpdateExpression: 'set #price = :price', ExpressionAttributeNames: { '#price': 'price' }, ExpressionAttributeValues: { ':price': price } }).promise();
        return { statusCode: 200, body: JSON.stringify({ message: 'Product updated successfully' }) };

      case 'DELETE':
        if (!name) {
          return { statusCode: 400, body: JSON.stringify({ error: 'Missing product name' }) };
        }
        await dynamodb.delete({ TableName: tableName, Key: { name } }).promise();
        return { statusCode: 200, body: JSON.stringify({ message: 'Product deleted successfully' }) };

      default:
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
  } catch (err) {
    console.log(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
