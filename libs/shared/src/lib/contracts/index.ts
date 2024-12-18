import { initContract } from '@ts-rest/core';
import { queries } from './queries';
import { commands } from './commands';

const c = initContract();

export const baseContract = c.router({
  ...commands,
  ...queries,
});
