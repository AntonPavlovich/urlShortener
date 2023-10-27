import { Handler } from 'aws-lambda';
import { nanoid } from 'nanoid';
import { PutCommand, PutCommandInput } from "@aws-sdk/lib-dynamodb";
import { convertExpirationDateToUnix, testUrl } from '../../utils/links';
import { ExpireAfter, Status } from '../../enums';
import { getDynamoDbClient } from '../../utils/shared';

const ddb = getDynamoDbClient();

export const generateShortLink: Handler = async event => {
  let statusCode: number;
  try {
    const { url, expirationTime } = JSON.parse(event.body);
    const { id, email } = event.requestContext.authorizer;

    if (!testUrl(url)) {
      statusCode = 400;
      throw new Error('Wrong URL string');
    }

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
        IsActive: true,
        Clicks: 0
      },
      ConditionExpression: "attribute_not_exists(ShortId)",
    }

    await ddb.send(new PutCommand(params));
    statusCode = 200;
    return {
      statusCode,
      body: JSON.stringify({
        status: Status.SUCCESS,
        ShortId: params.Item.ShortId,
        Clicks: params.Item.Clicks,
        OriginUrl: params.Item.OriginUrl
      })
    }
  } catch (ex) {
    console.error(ex);
    if(ex.code === "ConditionalCheckFailedException") {
      return {
        statusCode: 400,
        body: JSON.stringify({ status: Status.ERROR, error: 'Link with such id already exists. Please generate again.' })
      }
    }
    return {
      statusCode: statusCode ?? 500,
      body: JSON.stringify({
        status: Status.ERROR,
        error: 'Internal Server Error'
      })
    }
  }
}
