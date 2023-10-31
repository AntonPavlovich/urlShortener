import { Handler } from 'aws-lambda';
import { getDynamoDbClient, getSqsClient } from '../../utils/shared';
import { GetQueueUrlCommand, SendMessageCommand, SendMessageCommandInput } from '@aws-sdk/client-sqs';
import { QueryCommand, QueryCommandInput, UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

const ddb = getDynamoDbClient();
const sqs = getSqsClient();

export const deactivateLinkByCron: Handler = async (event, context, callback) => {
  try {
    const { QueueUrl } = await sqs.send(new GetQueueUrlCommand({ QueueName: process.env.DEACTIVATED_LINKS_QUEUE_NAME }));
    const { ShortId, UserEmail } = event;

    const updateCommandParams: UpdateCommandInput = {
      TableName: process.env.LINKS_TABLE_NAME,
      Key: {
        ShortId
      },
      ConditionExpression: 'UserEmail = :userEmail',
      UpdateExpression: 'Set IsActive = :isActive',
      ExpressionAttributeValues: {
        ":isActive": false,
        ":userEmail": UserEmail
      },
      ReturnValues: 'ALL_NEW'
    }
    const { Attributes } = await ddb.send(new UpdateCommand(updateCommandParams));
    if (Attributes) {
      const sendMessageCommandParams: SendMessageCommandInput = {
        QueueUrl,
        MessageBody: JSON.stringify({
          ShortId,
          UserEmail
        })
      };
      await sqs.send(new SendMessageCommand(sendMessageCommandParams));
    }

    return 'Finished';
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
}
