import { Handler } from 'aws-lambda';
import { ScanCommand, ScanCommandInput } from '@aws-sdk/lib-dynamodb';
import { BodyShape, ResponseShape } from '../../types/common.types';
import { Status } from '../../enums';
import { getDynamoDbClient } from '../../utils/shared';

const ddb = getDynamoDbClient();

export const getAllLinks: Handler = async event => {
  try {
    const { id, email } = event?.requestContext?.authorizer;
    const params: ScanCommandInput = {
      TableName: process.env.LINKS_TABLE_NAME,
      FilterExpression: 'UserEmail = :email AND IsActive = :isActive',
      ExpressionAttributeValues: {
        ":email": email,
        ":isActive": true
      }
    }

    const { Items = [] } = await ddb.send(new ScanCommand(params));
    const body: BodyShape = {
      status: Status.SUCCESS,
      data: { items: [...Items] }
    }
    return {
      statusCode: 200,
      body: JSON.stringify(body)
    } as ResponseShape;

  } catch (ex) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: ex?.message ?? 'Internal Server Error'
      })
    }
  }
}
