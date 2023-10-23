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
        UserEmail: email
      },
      UpdateExpression: 'SET IsActive = :active',
      ExpressionAttributeValues: {
        ":active": false
      },
    }

    await ddb.send(new UpdateCommand(params));
    return {
      statusCode: 200,
      body: JSON.stringify({
        linkId,
        active: false
      })
    }
  } catch (ex) {
    console.error(ex);
    return {
      body: JSON.stringify(ex)
    }
  }
}
