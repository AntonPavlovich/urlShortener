
export type UserCredentials = {
  email: string;
  password: string;
};

export type TokenPayload = {
  id: string
  email: string
}

export type TokenVerified = TokenPayload & {
  iat: number,
  exp: number
}

export type TokenPairs = {
  access: string,
  refresh: string
}
