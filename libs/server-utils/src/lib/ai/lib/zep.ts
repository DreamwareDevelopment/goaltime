import { ZepClient } from "@getzep/zep-cloud";

const API_KEY = process.env.ZEP_API_KEY;

if (!API_KEY) {
  throw new Error('ZEP_API_KEY is not set');
}

export const zep = new ZepClient({ apiKey: API_KEY });
