import { Handler } from 'aws-lambda';
import {
  GetCommand,
  GetCommandInput,
  UpdateCommand,
  UpdateCommandInput
} from '@aws-sdk/lib-dynamodb';
import { getDynamoDbClient } from '../../utils/shared';

const ddb = getDynamoDbClient();

export const redirect: Handler = async event => {
  console.log(event);
  try {
    const shortId = String(event?.pathParameters?.shortId) ?? '';

    const params: GetCommandInput = {
      TableName: process.env.LINKS_TABLE_NAME,
      Key: {
        ShortId: shortId
      }
    }
    const { Item } = await ddb.send(new GetCommand(params));
    if (!Item) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Not found' })
      }
    }
    if (Item.IsOneTime) {
      const params: UpdateCommandInput = {
        TableName: process.env.LINKS_TABLE_NAME,
        Key: {
          ShortId: shortId
        },
        UpdateExpression: 'SET IsActive = :active',
        ExpressionAttributeValues: {
          ":active": false,
        },
      }
      await ddb.send(new UpdateCommand(params))
    }

    return {
      statusCode: 308,
      headers: {
        Location: Item.OriginUrl,
      },
    }
  } catch (ex) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Bad request' })
    }
  }
};
