import { Handler } from 'aws-lambda';
import {
  ScanCommand,
  ScanCommandInput,
  UpdateCommand,
  UpdateCommandInput
} from '@aws-sdk/lib-dynamodb';
import { convertExpirationDateToUnix } from '../../utils/links';
import { ExpireAfter } from '../../enums';
import { getDynamoDbClient, getSqsClient } from '../../utils/shared';
import { GetQueueUrlCommand, SendMessageCommand, SendMessageCommandInput } from '@aws-sdk/client-sqs';

const ddb = getDynamoDbClient();
const sqs = getSqsClient();

export const deactivateLinkByCron: Handler = async (event, context, callback) => {
  try {
    const { QueueUrl } = await sqs.send(new GetQueueUrlCommand({ QueueName: process.env.DEACTIVATED_LINKS_QUEUE_NAME }));

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
    const { Items = [] } = await ddb.send(new ScanCommand(params));

    for (const link of Items) {
      const updateCommandParams: UpdateCommandInput = {
        TableName: process.env.LINKS_TABLE_NAME,
        Key: {
          ShortId: link.ShortId
        },
        UpdateExpression: 'SET IsActive = :active',
        ExpressionAttributeValues: {
          ":active": false
        },
      }

      await ddb.send(new UpdateCommand(updateCommandParams));

      const sendMessageCommandParams: SendMessageCommandInput = {
        QueueUrl,
        MessageBody: JSON.stringify({ ShortId: link.ShortId, Email: link.UserEmail }),
      };
      await sqs.send(new SendMessageCommand(sendMessageCommandParams))
    }
    console.log(Items);
    return 'Finished';
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
}
