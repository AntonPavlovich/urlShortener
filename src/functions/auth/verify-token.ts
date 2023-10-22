import { Handler } from "aws-lambda";
import { verifyAccess } from '../../utils/auth';

export const verifyToken: Handler = async (event) => {
  const { methodArn, headers: { Authorization: token } } = event;

  try {
    const payload = verifyAccess(token?.split(' ')[1]);
    const { id } = payload;
    return constructPolicy({
      principalId: id,
      methodArn,
      effect: 'Allow',
      context: { token }
    });
  } catch (ex) {
    return constructPolicy({
      principalId: 'user',
      methodArn,
      effect: 'Deny',
      context: {}
    })
  }
};

const constructPolicy = ({ principalId, methodArn, effect, context }) => {
  return {
    principalId: principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          "Action": "execute-api:Invoke",
          "Effect": effect,
          "Resource": methodArn
        }
      ]
    },
    context
  }
}
