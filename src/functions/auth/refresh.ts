import { Handler } from 'aws-lambda';
import { signTokenPair, verifyRefresh } from '../../utils/auth';
import { Status } from '../../enums';

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

export const refresh: Handler = async (event) => {
  let statusCode = 200;
  try {
    const { refreshToken } = JSON.parse(event?.body);
    const payload = verifyRefresh(refreshToken);
    const params = {
      TableName: process.env.USER_TABLE_NAME,
      Key: {
        Email: payload?.email
      }
    }
    const { Item } = await ddb.send(new GetCommand(params));
    if (!Item?.Email) {
      statusCode = 400;
      throw new Error('Bad request');
    }

    const tokenPair = signTokenPair({ id: payload.id, email: payload.email });
    const body = { status: Status.SUCCESS, tokenPair }
    return {
      statusCode,
      body: JSON.stringify(body)
    }
  } catch (ex) {
    const body = {
      status: Status.ERROR,
      error: ex?.message ?? 'Bad request'
    }
    statusCode = ex?.statusCode ?? 500;
    return {
      statusCode,
      body: JSON.stringify(body)
    }
  }
}
