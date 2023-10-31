import { Handler } from 'aws-lambda';
import { nanoid } from 'nanoid';
import { PutCommand, PutCommandInput } from "@aws-sdk/lib-dynamodb";
import { convertExpirationDateToUnix, testUrl } from '../../utils/links';
import { ExpireAfter, Status } from '../../enums';
import { getDynamoDbClient, getSchedulerClient } from '../../utils/shared';
import { CreateScheduleCommand, CreateScheduleCommandInput } from '@aws-sdk/client-scheduler';
import { randomUUID } from 'crypto';

const ddb = getDynamoDbClient();
const scheduler = getSchedulerClient();

export const generateShortLink: Handler = async event => {
  let statusCode: number;
  try {
    const { url, expirationTime } = JSON.parse(event.body);
    const { id, email } = event.requestContext.authorizer;
    const accountId = event.requestContext.accountId;

    if (!testUrl(url)) {
      statusCode = 400;
      throw new Error('Wrong URL string');
    }

    const expirationTimeInUnix = convertExpirationDateToUnix(expirationTime);
    const isOneTime = expirationTime === ExpireAfter.ONE_TIME;
    const number = Math.floor(Math.random() * (6 - 3 + 1) + 3);

    const putCommandParams: PutCommandInput = {
      TableName: process.env.LINKS_TABLE_NAME,
      Item: {
        ShortId: nanoid(number),
        OriginUrl: url,
        UserEmail: email,
        IsOneTime: isOneTime,
        IsActive: true,
        Clicks: 0
      },
      ConditionExpression: "attribute_not_exists(ShortId)",
    }
    await ddb.send(new PutCommand(putCommandParams));

    if (!isOneTime) {
      const [ scheduledDate ] = new Date(expirationTimeInUnix)?.toISOString()?.split('.');
      if (!scheduledDate) {
        throw new Error('Cannot create correct date!');
      }

      const createScheduleCommandParams: CreateScheduleCommandInput = {
        Name: randomUUID(),
        ScheduleExpression: `at(${scheduledDate})`,
        FlexibleTimeWindow: {
          Mode: 'OFF'
        },
        Target: {
          Arn: `arn:aws:lambda:${process.env.REGION}:${accountId}:function:${process.env.DEACTIVATE_FUNC_NAME}`,
          RoleArn: `arn:aws:iam::${accountId}:role/${process.env.ROLE_NAME}`,
          Input: JSON.stringify({ ShortId: putCommandParams.Item.ShortId, UserEmail: email }),
        },
        ActionAfterCompletion: 'DELETE'
      };

      await scheduler.send(new CreateScheduleCommand(createScheduleCommandParams));
    }

    statusCode = 200;
    return {
      statusCode,
      body: JSON.stringify({
        status: Status.SUCCESS,
        ShortId: putCommandParams.Item.ShortId,
        Clicks: putCommandParams.Item.Clicks,
        OriginUrl: putCommandParams.Item.OriginUrl
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
