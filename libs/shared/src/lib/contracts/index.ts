import { initContract } from '@ts-rest/core';
import { queries } from './queries';
import { commands } from './commands';

const c = initContract();

function deepMerge<T extends typeof commands, R extends typeof queries>(obj1: T, obj2: R): T & R {
  const result = { ...obj1 };
  for (const key in obj2) {
    if (key in result) {
      result[key as keyof T] = { ...result[key as keyof T], ...obj2[key as keyof R] };
    } else {
      result[key as keyof T] = obj2[key as keyof R] as unknown as T[keyof T];
    }
  }
  return result as T & R;
}

const result = deepMerge(commands, queries)
export const baseContract = c.router(result);
