// All zod schemas are used for parsing input data, not defining the database schema.
// Generally, the zod schema will have optional fields with default values 
// that are not optional in the database schema so as to have less null checks
// in the codebase.

export * from "./goals";
export * from "./auth";
