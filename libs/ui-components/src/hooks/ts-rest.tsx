import { initClient } from "@ts-rest/core";
import { baseContract } from "@/shared/contracts";
import { TokenInfo } from "./supabase";

// TODO: Make this a singleton after figuring out how to handle types of static variables
export async function getTsRestClient(tokenInfo: TokenInfo) {
  const baseUrl = process.env.NEXT_PUBLIC_WEBSERVER_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_WEBSERVER_URL is not set');
  }

  const authorizationHeader = `Bearer ${tokenInfo.accessToken}`;
  const client = initClient(baseContract, {
    baseUrl,
    baseHeaders: {
      Authorization: authorizationHeader,
    },
  });
  return client;
}
