import { Handler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import * as bcrypt from "bcryptjs";
import { signTokenPair } from '../../utils/auth';
import { UserCredentials, TokenPayload } from '../../types/auth.types';
import { Status } from '../../enums';

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

export const signIn: Handler = async (event) => {
  let statusCode = 500;
  console.log(event)
  try {
    const { email, password }: UserCredentials = JSON.parse(event?.body);
    const params = {
      TableName: `${process?.env?.USER_TABLE_NAME}`,
      Key: {
        Email: email
      }
    }
    console.log('PARAMS', params)

    const { Item } = await ddb.send(new GetCommand(params));
    if (!Item) {
      statusCode = 400;
      throw new Error('Something wrong with email or password.')
    }

    const { Id, Email, Password: hashed } = Item;
    const match = await bcrypt.compare(password, hashed);

    if (!match) {
      statusCode = 400;
      throw new Error('Something wrong with email or password.')
    }
    const payload: TokenPayload = { id: Id, email: Email }
    const tokenPair = signTokenPair(payload);
    const body = { status: Status.SUCCESS, tokenPair}
    return {
      statusCode: 200,
      body: JSON.stringify(body)
    }

  } catch (ex) {
    const body = { status: Status.ERROR, error: ex?.message ?? "Error while signing up." }
    return {
      statusCode,
      body: JSON.stringify(body)
    }
  }
}
