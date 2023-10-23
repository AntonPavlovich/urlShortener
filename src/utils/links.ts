import { ExpireAfter } from '../enums';
import addDays from 'date-fns/addDays';
import getUnixTime from 'date-fns/getUnixTime'

export const convertExpirationDateToUnix = (expireAfter: ExpireAfter): number => {
  if( !Object.values(ExpireAfter).includes(expireAfter) ) {
    throw new Error('Wrong value for expirationTime!');
  }
  const [ days ] = expireAfter.split('');
  return getUnixTime(addDays(Date.now(), parseInt(days, 10)));
}

