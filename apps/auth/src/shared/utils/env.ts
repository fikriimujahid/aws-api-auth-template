export type EnvParser<TValue> = (rawValue: string, key: string) => TValue;

export interface EnvSchemaEntry<TValue> {
  required?: boolean;
  defaultValue?: TValue;
  parse?: EnvParser<TValue>;
}

export type EnvSchema = Record<string, EnvSchemaEntry<unknown>>;

export type InferEnv<TSchema extends EnvSchema> = {
  [K in keyof TSchema]: TSchema[K] extends EnvSchemaEntry<infer TValue> ? TValue : never;
};

export const defineEnvSchema = <TSchema extends EnvSchema>(schema: TSchema): TSchema => schema;

export const parseNumberEnv = (rawValue: string, key: string): number => {
  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }

  return value;
};

export const parseBooleanEnv = (rawValue: string, key: string): boolean => {
  const normalized = rawValue.trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  throw new Error(`Environment variable ${key} must be either 'true' or 'false'`);
};

export const validateEnv = <TSchema extends EnvSchema>(
  source: NodeJS.ProcessEnv,
  schema: TSchema
): InferEnv<TSchema> => {
  const result: Partial<InferEnv<TSchema>> = {};

  for (const [key, definition] of Object.entries(schema)) {
    const rawValue = source[key];
    const hasValue = typeof rawValue === "string" && rawValue.trim().length > 0;

    if (!hasValue) {
      if (definition.defaultValue !== undefined) {
        result[key as keyof TSchema] = definition.defaultValue as InferEnv<TSchema>[keyof TSchema];
        continue;
      }

      if (definition.required) {
        throw new Error(`Missing required environment variable: ${key}`);
      }

      result[key as keyof TSchema] = undefined as InferEnv<TSchema>[keyof TSchema];
      continue;
    }

    const parsedValue = definition.parse
      ? definition.parse(rawValue as string, key)
      : (rawValue as unknown);

    result[key as keyof TSchema] = parsedValue as InferEnv<TSchema>[keyof TSchema];
  }

  return result as InferEnv<TSchema>;
};
