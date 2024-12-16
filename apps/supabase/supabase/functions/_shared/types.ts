import * as zod from 'npm:zod'

export const InsertPayloadSchema = zod.object({
  type: zod.literal('INSERT'),
  table: zod.string(),
  schema: zod.string(),
  record: zod.object({}),
  old_record: zod.null(),
});

export const UpdatePayloadSchema = zod.object({
  type: zod.literal('UPDATE'),
  table: zod.string(),
  schema: zod.string(),
  record: zod.any(),
  old_record: zod.any(),
});

export const DeletePayloadSchema = zod.object({
  type: zod.literal('DELETE'),
  table: zod.string(),
  schema: zod.string(),
  record: zod.null(),
  old_record: zod.any(),
});