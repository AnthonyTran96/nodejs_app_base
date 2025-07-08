export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'json' | 'bigint' | 'array';

export type RepositorySchema<T> = Partial<Record<keyof T, FieldType>>;
