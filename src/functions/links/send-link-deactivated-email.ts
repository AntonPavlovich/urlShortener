import { Handler } from 'aws-lambda';
import { getSesClient } from '../../utils/shared';
import { SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';

const ses = getSesClient();

export const sendLinkDeactivatedEmail: Handler = async event => {
  console.log(event);
  try {
    const { Records = [] } = event;

    for (const record of Records) {
      const body = JSON.parse(record.body);
      const params: SendEmailCommandInput = {
        Destination: {
          ToAddresses: [ body.UserEmail ]
        },
        Source: 'ya.anton.pavlovich@proton.me',
        Message: {
          Subject: {
            Data: 'Your link have been deactivated.',
          },
          Body: {
            Text: {
              Data: `Your link with ID ${body.ShortId} have been deactivated.`
            },
          },
        },
      };

      await ses.send(new SendEmailCommand(params));
    }


    return 'Finished'
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
}
