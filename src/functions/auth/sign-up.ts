import { Handler } from "aws-lambda";
import { PutCommand, PutCommandInput } from "@aws-sdk/lib-dynamodb";
import * as bcrypt from "bcryptjs";
import { TokenPayload, UserCredentials } from '../../types/auth.types';
import { Status } from '../../enums';
import { randomUUID } from 'crypto';
import { signTokenPair } from '../../utils/auth';
import { getDynamoDbClient, getSesClient } from '../../utils/shared';
import { VerifyEmailAddressCommandInput, VerifyEmailIdentityCommand } from '@aws-sdk/client-ses';

const ddb = getDynamoDbClient();
const ses = getSesClient();

export const signUp: Handler = async (event) => {
  let statusCode = 500;

  try {
    const { email, password }: UserCredentials = JSON.parse(event.body);

    if(!(email?.trim() && password?.trim())) {
      statusCode = 400;
      throw new Error("Email and Password both must be a string!");
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const putCommandParams: PutCommandInput = {
      TableName: `${process?.env?.USER_TABLE_NAME}`,
      Item: {
        Id: randomUUID(),
        Email: email,
        Password: hashedPassword,
      },
      ConditionExpression: "attribute_not_exists(Email)",
    };

    const response = await ddb.send(new PutCommand(putCommandParams));

    const verifyEmailCommandParams: VerifyEmailAddressCommandInput = {
      EmailAddress: email
    }
    await ses.send(new VerifyEmailIdentityCommand(verifyEmailCommandParams));

    const payload: TokenPayload = { id: putCommandParams.Item.Id, email: putCommandParams.Item.Email };
    const tokenPair = signTokenPair(payload);

    return {
      statusCode: 201,
      body: JSON.stringify({
        status: Status.SUCCESS,
        tokenPair
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
        statusCode: 500,
        body: JSON.stringify(body),
      };
    }
  }
};
