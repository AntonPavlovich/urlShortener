//dynamo db
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
//sqs
import { SQSClient } from "@aws-sdk/client-sqs";

export const getDynamoDbClient = (): DynamoDBClient => {
  return DynamoDBDocumentClient.from(new DynamoDBClient({}));
}

export const getSqsClient = (): SQSClient => {
  return new SQSClient({ region: process.env.REGION });
}
