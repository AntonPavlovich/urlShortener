import { Handler } from 'aws-lambda';
import { getDynamoDbClient, getSqsClient } from '../../utils/shared';
import { GetQueueUrlCommand, SendMessageCommand, SendMessageCommandInput } from '@aws-sdk/client-sqs';
import { QueryCommand, QueryCommandInput, UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

const ddb = getDynamoDbClient();
const sqs = getSqsClient();

export const deactivateLinkByCron: Handler = async (event, context, callback) => {
  try {
    const { QueueUrl } = await sqs.send(new GetQueueUrlCommand({ QueueName: process.env.DEACTIVATED_LINKS_QUEUE_NAME }));
    const { ShortId } = event;

    const queryCommandParams: QueryCommandInput = {
      TableName: process.env.LINKS_TABLE_NAME,
      KeyConditionExpression: 'ShortId = :shortId',
      FilterExpression: 'IsActive = :isActive',
      ExpressionAttributeValues: {
        ":shortId": ShortId,
        ":isActive": true
      },
      ProjectionExpression: 'ShortId, UserEmail'
    };
    const { Items: [ link ] = [] } = await ddb.send(new QueryCommand(queryCommandParams));
    if (!link) {
      throw new Error("No such link in database!");
    }

    const updateCommandParams: UpdateCommandInput = {
      TableName: process.env.LINKS_TABLE_NAME,
      Key: {
        ShortId: link.ShortId
      },
      UpdateExpression: 'Set IsActive = :isActive',
      ExpressionAttributeValues: {
        ":isActive": false
      }
    }
    await ddb.send(new UpdateCommand(updateCommandParams));

    const sendMessageCommandParams: SendMessageCommandInput = {
      QueueUrl,
      MessageBody: JSON.stringify({
        ShortId: link.ShortId,
        UserEmail: link.UserEmail,
      })
    };
    await sqs.send(new SendMessageCommand(sendMessageCommandParams));

    return 'Finished';
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
}
