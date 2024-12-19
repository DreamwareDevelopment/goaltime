import { initClient } from "@ts-rest/core";
import { baseContract } from "@/shared/contracts";

// TODO: Make this a singleton after figuring out how to handle types of static variables
export function getTsRestClient() {
  const baseUrl = process.env.NEXT_PUBLIC_HOST;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_HOST is not set');
  }
  const client = initClient(baseContract, {
    baseUrl,
    baseHeaders: {},
  });
  return client;
}
