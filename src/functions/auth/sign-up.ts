import { Handler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import * as bcrypt from "bcryptjs";
import { TokenPayload, UserCredentials } from '../../types/auth.types';
import { Status } from '../../enums';
import { randomUUID } from 'crypto';
import { signTokenPair } from '../../utils/auth';

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

export const signUp: Handler = async (event) => {
  let statusCode = 500;

  try {
    const { email, password }: UserCredentials = JSON.parse(event.body);

    if(!(email?.trim() && password?.trim())) {
      statusCode = 400;
      throw new Error("Email and Password both must be a string!");
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const params = {
      TableName: `${process?.env?.USER_TABLE_NAME}`,
      Item: {
        Id: randomUUID(),
        Email: email,
        Password: hashedPassword,
      },
      ConditionExpression: "attribute_not_exists(Email)",
    };

    const response = await ddb.send(new PutCommand(params));
    console.log('RESPONSE!', response)

    const payload: TokenPayload = { id: params.Item.Id, email: params.Item.Email };
    const tokenPair = signTokenPair(payload);

    return {
      statusCode: 201,
      body: JSON.stringify({
        status: Status.SUCCESS,
        data: tokenPair
      })
    };
  } catch (ex) {
    const body = {
      status: Status.ERROR,
      error: ex,
    };

    if(ex.code === "ConditionalCheckFailedException") {
      body.error = "Item with the same email already exists.";
      return {
        statusCode: 400,
        body: JSON.stringify(body),
      };
    } else {
      body.error = ex?.message ?? "Error while SignUp processing.";
      return {
        statusCode,
        body: JSON.stringify(body),
      };
    }
  }
};
