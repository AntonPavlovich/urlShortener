import { Handler } from 'aws-lambda';
import { nanoid } from 'nanoid';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, PutCommandInput } from "@aws-sdk/lib-dynamodb";
import { convertExpirationDateToUnix } from '../../utils/links';
import { ExpireAfter, Status } from '../../enums';

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

// ID (short link) originLink expirationTime userEmail

export const generateShortLink: Handler = async event => {
  let statusCode = 200;
  console.log(event);
  try {
    const { url, expirationTime } = JSON.parse(event.body);
    const { id, email } = event.requestContext.authorizer;

    const expirationTimeInUnix = convertExpirationDateToUnix(expirationTime);
    const number = Math.floor(Math.random() * (6 - 3 + 1) + 3);

    const params: PutCommandInput = {
      TableName: process.env.LINKS_TABLE_NAME,
      Item: {
        ShortId: nanoid(number),
        OriginUrl: url,
        ExpirationTime: expirationTimeInUnix,
        UserEmail: email,
        IsOneTime: expirationTime === ExpireAfter.ONE_TIME,
        IsActive: true
      },
      ConditionExpression: "attribute_not_exists(ShortId)",
    }

    await ddb.send(new PutCommand(params));
    return {
      statusCode,
      body: JSON.stringify({
        status: Status.SUCCESS,
        data: params.Item
      })
    }
  } catch (ex) {
    console.error(ex);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: ex?.message ?? 'Internal Server Error'
      })
    }
  }
}
