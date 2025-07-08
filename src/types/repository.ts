export type FieldType =
  | 'string' // Default string handling
  | 'text' // Large text fields (same as string but semantic distinction)
  | 'number' // General number (parseFloat)
  | 'integer' // Specific integer handling (parseInt)
  | 'float' // Explicit float handling (parseFloat)
  | 'decimal' // High precision decimal (parseFloat with validation)
  | 'boolean' // Boolean conversion with multiple input formats
  | 'date' // Date object conversion
  | 'datetime' // Alias for date (semantic distinction)
  | 'timestamp' // Unix timestamp to Date conversion
  | 'json' // JSON.parse() for objects
  | 'array' // JSON.parse() for arrays
  | 'bigint' // BigInt() conversion
  | 'buffer' // Buffer handling for binary data
  | 'uuid' // UUID string validation and formatting
  | 'enum'; // Enum validation with enumValues/enumType

export interface FieldConfig {
  type?: FieldType;
  column?: string; // Maps model field to specific database column name
  enumType?: any; // Direct enum type reference
  enumValues?: (string | number)[]; // Legacy approach
  precision?: number; // For decimal type
  transform?: (value: any) => any; // Custom transformation function
  nullable?: boolean; // Whether field can be null (for validation)
}

export type RepositorySchema<T> = Partial<Record<keyof T, FieldType | FieldConfig>>;
