// All zod schemas are used for parsing input data, not defining the database schema.
// Generally, the zod schema will have optional fields with default values 
// that are not optional in the database schema so as to have less null checks
// in the codebase.

import z from "zod"

export * from "./auth";
export * from "./goals";
export * from "./user";

type DeepRemoveDefault<I extends z.ZodTypeAny> =
  I extends z.ZodDefault<infer T> ? T
  : I extends z.ZodObject<infer T, infer U, infer C, infer O, infer I> ? z.ZodObject<{[P in keyof T]: DeepRemoveDefault<T[P]>}, U, C, O ,I>
  : I extends z.ZodArray<infer T, infer C> ? z.ZodArray<DeepRemoveDefault<T>, C>
  : I extends z.ZodOptional<infer T> ? z.ZodOptional<DeepRemoveDefault<T>>
  : I extends z.ZodNullable<infer T> ? z.ZodNullable<DeepRemoveDefault<T>>
  : I;

export function getDefaultValue<Schema extends z.ZodDefault<z.ZodTypeAny>>(field: Schema): z.infer<Schema> {
    return field._def.defaultValue();
}

export function getDefaults<Schema extends z.AnyZodObject>(schema: Schema) {
    return Object.fromEntries(
        Object.entries(schema.shape).map(([key, value]) => {
            if (value instanceof z.ZodDefault) return [key, value._def.defaultValue()]
            return [key, undefined]
        })
    )
}

export function deepRemoveDefaults <I extends z.ZodTypeAny>(schema: I): DeepRemoveDefault<I> {
    if ( schema instanceof z.ZodDefault )
        return deepRemoveDefaults( schema.removeDefault() )

    if ( schema instanceof z.ZodObject ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newShape: any = {}

        for ( const key in schema.shape ) {
            const fieldSchema = schema.shape[ key ]
            newShape[ key ] = deepRemoveDefaults( fieldSchema )
        }
        return new z.ZodObject( {
            ...schema._def,
            shape: () => newShape,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } ) as any
    }

    if ( schema instanceof z.ZodArray )
        return z.ZodArray.create( deepRemoveDefaults( schema.element ) ) as DeepRemoveDefault<I>

    if ( schema instanceof z.ZodOptional )
        return z.ZodOptional.create( deepRemoveDefaults( schema.unwrap() ) ) as DeepRemoveDefault<I>

    if ( schema instanceof z.ZodNullable )
        return z.ZodNullable.create( deepRemoveDefaults( schema.unwrap() ) ) as DeepRemoveDefault<I>

    return schema as DeepRemoveDefault<I>
}
