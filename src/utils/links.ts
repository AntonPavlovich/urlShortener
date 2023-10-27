import { ExpireAfter } from '../enums';

const ONE_DAY_IN_MLS = 86_400_000;

export const convertExpirationDateToUnix = (expireAfter: ExpireAfter): number => {
  if( !Object.values(ExpireAfter).includes(expireAfter) ) {
    throw new Error('Wrong value for expirationTime!');
  }
  const [ days ] = expireAfter.split('');
  return addDays(Date.now(), parseInt(days, 10));
}

const addDays = (dateInMilliseconds: number, amountOfDays: number): number => {
  return dateInMilliseconds + (amountOfDays * ONE_DAY_IN_MLS);
}

export const testUrl = (url: string): boolean => {
  return /^(https?:\/\/)?([A-Za-z0-9.-]+\.[A-Za-z]{2,})(:\d+)?(\/[A-Za-z0-9_.-]+)*\/?(\?[A-Za-z0-9_=&-]+)?(#.*)?$/.test(url);
}

