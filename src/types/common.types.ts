import { Status } from '../enums';

export type ResponseShape = {
  statusCode: number,
  body: string
}

export type BodyShape = {
  status: Status,
  data?: {
    [key: string]: any
  },
  error?: string
}
