import { Handler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, UpdateCommandInput } from "@aws-sdk/lib-dynamodb";
import { Status } from '../../enums';

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client)

export const deactivateLink: Handler = async event => {
  try {
    console.log(event);
    const { linkId } = JSON.parse(event.body);
    const { id, email } = event?.requestContext?.authorizer;

    const params: UpdateCommandInput = {
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

    await ddb.send(new UpdateCommand(params));
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
        body: JSON.stringify({ message: 'Forbidden' })
      }
    }
    return {
      body: JSON.stringify(ex)
    }
  }
}
