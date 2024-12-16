/* eslint-disable @typescript-eslint/no-explicit-any */
// deno-lint-ignore-file no-explicit-any

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { BeforeUnloadEvent } from "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { google } from "npm:googleapis"

import { GoogleAuth } from "../_shared/bundle/models.ts"
import { getPrismaClient } from "../_shared/bundle/prisma.ts"

import { InsertPayloadSchema } from "../_shared/types.ts"

const calendar = google.calendar('v3')
const auth = google.oauth2('v2')

declare const EdgeRuntime: {
  waitUntil: (promise: Promise<any>) => void;
};

async function initialDownsync(body: any) {
  const payload = InsertPayloadSchema.parse(body)
  const record = payload.record as GoogleAuth
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  auth
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  calendar
  const prisma = await getPrismaClient()
  const gAuth = await prisma.googleAuth.findFirst({
    where: {
      userId: record.userId,
    },
  })
  if (!gAuth) {
    throw new Error('No Google Auth found')
  }
  console.log('Function request body', JSON.stringify(body, null, 2))
}

addEventListener('beforeunload', (ev: BeforeUnloadEvent) => {
  console.log('Function will be shutdown due to', ev.detail?.reason)
  // save state or log the current progress
})

Deno.serve(async (req: Request) => {
  // Mark the longRunningTask's returned promise as a background task.
  // note: we are not using await because we don't want it to block.
  console.log('Starting initial downsync')
  const body = await req.json()
  console.log('Function request body', JSON.stringify(body, null, 2))
  EdgeRuntime.waitUntil(initialDownsync(body))
  return new Response('ok')
})
