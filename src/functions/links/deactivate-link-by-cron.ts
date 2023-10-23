import { Handler } from 'aws-lambda';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommandInput, UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';
import { convertExpirationDateToUnix } from '../../utils/links';
import { ExpireAfter } from '../../enums';

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

export const deactivateLinkByCron: Handler = async (event, context, callback) => {
  try {
    const currentUnixDate = convertExpirationDateToUnix(ExpireAfter.ONE_TIME);

    const params: ScanCommandInput = {
      TableName: process.env.LINKS_TABLE_NAME,
      FilterExpression: 'IsActive = :isActive AND ExpirationTime < :currentUnixDate AND IsOneTime = :isOneTime',
      ExpressionAttributeValues: {
        ':isActive': true,
        ':currentUnixDate': currentUnixDate,
        ':isOneTime': false
      }
    }
    const { Items } = await ddb.send(new ScanCommand(params));

    for (const link of Items) {
      const params: UpdateCommandInput = {
        TableName: process.env.LINKS_TABLE_NAME,
        Key: {
          ShortId: link.ShortId
        },
        UpdateExpression: 'SET IsActive = :active',
        ExpressionAttributeValues: {
          ":active": false
        },
      }

      await ddb.send(new UpdateCommand(params));
    }

    console.log(Items);
    callback(null, `Finished.`);
  } catch (ex) {
    console.error(ex);
    callback(ex);
  }
}
