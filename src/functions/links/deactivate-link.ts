import { Handler } from 'aws-lambda';
import { UpdateCommand, UpdateCommandInput } from "@aws-sdk/lib-dynamodb";
import { Status } from '../../enums';
import { getDynamoDbClient, getSqsClient } from '../../utils/shared';
import { GetQueueUrlCommand, SendMessageCommand, SendMessageCommandInput } from '@aws-sdk/client-sqs';

const ddb = getDynamoDbClient();
const sqs = getSqsClient();

export const deactivateLink: Handler = async event => {
  try {
    const { linkId } = JSON.parse(event.body);
    const { id, email } = event?.requestContext?.authorizer;

    const { QueueUrl } = await sqs.send(new GetQueueUrlCommand({ QueueName: process.env.DEACTIVATED_LINKS_QUEUE_NAME }));

    const updateCommandParams: UpdateCommandInput = {
      TableName: process.env.LINKS_TABLE_NAME,
      Key: {
        ShortId: linkId,
      },
      ConditionExpression: 'UserEmail = :email',
      UpdateExpression: 'SET IsActive = :active',
      ExpressionAttributeValues: {
        ":active": false,
        ":email": email
      },
    }

    await ddb.send(new UpdateCommand(updateCommandParams));

    const sendMessageCommandParams: SendMessageCommandInput = {
      QueueUrl,
      MessageBody: JSON.stringify({
        ShortId: updateCommandParams.Key.ShortId,
        UserEmail: email,
      })
    };

    await sqs.send(new SendMessageCommand(sendMessageCommandParams));
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: Status.SUCCESS,
        linkId,
      })
    }
  } catch (ex) {
    console.error(ex);
    if (ex.code === 'ConditionalCheckFailedException') {
      return {
        statusCode: 403,
        body: JSON.stringify({
          status: Status.ERROR,
          message: 'Forbidden'
        })
      }
    }
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: Status.ERROR,
        message: 'Internal Server Error'
      })
    }
  }
}
