import jwt from 'jsonwebtoken';
import { TokenPairs, TokenPayload, TokenVerified } from '../types/auth.types';
import { TokenType } from '../enums';

const accessSecret = process?.env?.JWT_SECRET_ACCESS;
const refreshSecret = process?.env?.JWT_SECRET_REFRESH;

export const signTokenPair = (payload: TokenPayload): TokenPairs => {
  const access = signToken(payload, TokenType.ACCESS);
  const refresh = signToken(payload, TokenType.REFRESH);

  return { access, refresh };
}

const signToken = (payload: TokenPayload, tokenType: TokenType): string => {
  try {
    switch (tokenType) {
      case TokenType.ACCESS:
        return jwt.sign(payload, accessSecret, { expiresIn: '3m' })
      case TokenType.REFRESH:
        return jwt.sign(payload, refreshSecret, { expiresIn: '24h' })
    }
  } catch (ex) {
    throw ex;
  }
}

export const verifyAccess = (token: string): TokenVerified => {
  try {
    return jwt.verify(token, accessSecret)
  } catch (ex) {
    throw ex;
  }
}

export const verifyRefresh = (token: string): TokenVerified => {
  try {
    return jwt.verify(token, refreshSecret)
  } catch (ex) {
    throw ex;
  }
}

