import { Handler } from 'aws-lambda';

export const healthCheck: Handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        event,
        context
      },
      null,
      2
    ),
  };
};
