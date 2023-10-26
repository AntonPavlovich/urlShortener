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
  try {
    const shortId = String(event?.pathParameters?.shortId) ?? '';

    const getCommandParams: GetCommandInput = {
      TableName: process.env.LINKS_TABLE_NAME,
      Key: {
        ShortId: shortId
      },
    }
    const { Item } = await ddb.send(new GetCommand(getCommandParams));
    if (!Item || !Item.IsActive) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Not found' })
      }
    }
    const updateCommandParams: UpdateCommandInput = {
      TableName: process.env.LINKS_TABLE_NAME,
      Key: {
        ShortId: shortId
      },
      UpdateExpression: 'SET Clicks = :clicks',
      ExpressionAttributeValues: {
        ':clicks': Item.Clicks + 1
      }
    }
    if (Item.IsOneTime) {
      updateCommandParams.UpdateExpression += ' ,IsActive = :active';
      updateCommandParams.ExpressionAttributeValues = {
        ...updateCommandParams.ExpressionAttributeValues,
        ':active': false
      }
    }
    await ddb.send(new UpdateCommand(updateCommandParams));

    return {
      statusCode: 308,
      headers: {
        'Location': Item.OriginUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: 0,
      },
    }
  } catch (ex) {
    console.error(ex);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Bad request' })
    }
  }
};
