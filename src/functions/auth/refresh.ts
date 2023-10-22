import { Handler } from 'aws-lambda';
import { signTokenPair, verifyRefresh } from '../../utils/auth';
import { Status } from '../../enums';

export const refresh: Handler = async (event) => {
  let statusCode = 200;
  try {
    const { refreshToken } = JSON.parse(event?.body);
    const payload = verifyRefresh(refreshToken);

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
