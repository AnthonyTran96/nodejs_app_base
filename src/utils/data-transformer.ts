import { FieldConfig, RepositorySchema } from '@/types/repository';

/**
 * DataTransformer - Utility class for handling data transformation
 *
 * This class extracts the data transformation logic from BaseRepository
 * to make it reusable in custom queries and complex operations.
 */
export class DataTransformer {
  /**
   * Get field configuration from schema
   */
  static getFieldConfig<T>(schema: RepositorySchema<T>, fieldKey: keyof T): FieldConfig {
    const schemaValue = schema[fieldKey];

    if (!schemaValue) {
      return {};
    }

    if (typeof schemaValue === 'string') {
      return { type: schemaValue };
    }

    return schemaValue as FieldConfig;
  }

  /**
   * Get the database column name for a model field
   */
  static getColumnName<T>(schema: RepositorySchema<T>, fieldKey: string): string {
    const fieldConfig = this.getFieldConfig(schema, fieldKey as keyof T);

    if (fieldConfig.column) {
      return fieldConfig.column;
    }

    // Default: convert camelCase to snake_case
    return fieldKey.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Get the model field name from a database column
   */
  static getFieldName<T>(schema: RepositorySchema<T>, columnName: string): string {
    // First check if any field in schema has a custom column mapping to this column
    for (const fieldKey in schema) {
      const fieldConfig = this.getFieldConfig(schema, fieldKey);
      if (fieldConfig.column === columnName) {
        return fieldKey;
      }
    }

    // Default: convert snake_case to camelCase
    return columnName.replace(/_([a-z])/g, g => (g[1] ? g[1].toUpperCase() : ''));
  }

  /**
   * Transform database row to model object based on schema
   * Supports both standard repository schemas and custom field mappings with transforms
   */
  static transformRow<T>(row: any, schema: RepositorySchema<T>): T {
    if (!row) {
      return row;
    }

    const transformed: { [key: string]: any } = {};

    // 1. Convert database columns to model fields (considering custom mappings)
    for (const columnName in row) {
      if (Object.prototype.hasOwnProperty.call(row, columnName)) {
        const fieldName = this.getFieldName(schema, columnName);
        transformed[fieldName] = row[columnName];
      }
    }

    // 2. Apply transformations based on schema
    for (const fieldKey in schema) {
      const fieldConfig = this.getFieldConfig(schema, fieldKey as keyof T);

      // Handle custom transform functions first
      if (fieldConfig.transform) {
        const columnName = fieldConfig.column || this.getColumnName(schema, fieldKey);
        transformed[fieldKey] = fieldConfig.transform(row[columnName]);
        continue;
      }

      // Apply type transformations for fields that exist in transformed data
      if (Object.prototype.hasOwnProperty.call(transformed, fieldKey)) {
        const originalValue = transformed[fieldKey];

        if (originalValue === null || originalValue === undefined) {
          continue;
        }

        if (fieldConfig.type) {
          transformed[fieldKey] = this.transformFieldValue(originalValue, fieldConfig, fieldKey);
        }
      }
    }

    return transformed as T;
  }

  /**
   * Transform model data to database format based on schema
   */
  static transformInputData<T>(data: any, schema: RepositorySchema<T>): any {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return data;
    }

    const dbData: { [key: string]: any } = {};

    for (const fieldKey in data) {
      if (Object.prototype.hasOwnProperty.call(data, fieldKey)) {
        const columnName = this.getColumnName(schema, fieldKey);
        let value = data[fieldKey];

        // Get field configuration for type-specific conversion
        const fieldConfig = this.getFieldConfig(schema, fieldKey as keyof T);

        // Apply input transformations based on field type
        if (fieldConfig.type && value !== null && value !== undefined) {
          value = this.transformInputFieldValue(value, fieldConfig, fieldKey);
        }

        dbData[columnName] = value;
      }
    }

    return dbData;
  }

  /**
   * Transform a single field value based on its type configuration (for reading from DB)
   */
  static transformFieldValue(originalValue: any, fieldConfig: FieldConfig, fieldKey: string): any {
    switch (fieldConfig.type) {
      case 'string':
      case 'text':
        // Ensure string conversion
        return originalValue?.toString() || '';

      case 'boolean':
        // Handle various boolean representations from database
        if (typeof originalValue === 'boolean') {
          return originalValue;
        } else if (typeof originalValue === 'string') {
          const lowerValue = originalValue.toLowerCase();
          return (
            lowerValue === 'true' ||
            lowerValue === '1' ||
            lowerValue === 'yes' ||
            lowerValue === 'on'
          );
        } else if (typeof originalValue === 'number') {
          return originalValue !== 0;
        } else {
          return Boolean(originalValue);
        }

      case 'number':
      case 'float':
        const floatValue = parseFloat(originalValue);
        return isNaN(floatValue) ? 0 : floatValue;

      case 'integer':
        const intValue = parseInt(originalValue, 10);
        return isNaN(intValue) ? 0 : intValue;

      case 'decimal':
        const decimalValue = parseFloat(originalValue);
        if (isNaN(decimalValue)) {
          return 0;
        } else {
          // Apply precision if specified
          if (fieldConfig.precision !== undefined) {
            return parseFloat(decimalValue.toFixed(fieldConfig.precision));
          } else {
            return decimalValue;
          }
        }

      case 'date':
      case 'datetime':
        try {
          return new Date(originalValue);
        } catch (e) {
          console.error(`Failed to convert to Date for field '${fieldKey}':`, originalValue);
          return new Date(); // Default to current date
        }

      case 'timestamp':
        try {
          // Handle Unix timestamp (seconds or milliseconds)
          const timestamp = parseInt(originalValue, 10);
          if (isNaN(timestamp)) {
            return new Date();
          } else {
            // If timestamp is in seconds (10 digits), convert to milliseconds
            const tsValue = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
            return new Date(tsValue);
          }
        } catch (e) {
          console.error(`Failed to convert timestamp for field '${fieldKey}':`, originalValue);
          return new Date();
        }

      case 'json':
      case 'array':
        if (typeof originalValue === 'string') {
          try {
            return JSON.parse(originalValue);
          } catch (e) {
            console.error(`Failed to parse JSON/Array for field '${fieldKey}':`, originalValue);
            return fieldConfig.type === 'array' ? [] : {};
          }
        } else if (originalValue === null || originalValue === undefined) {
          return fieldConfig.type === 'array' ? [] : {};
        } else {
          // Already an object/array
          return originalValue;
        }

      case 'bigint':
        try {
          return BigInt(originalValue);
        } catch (e) {
          console.error(`Failed to convert to BigInt for field '${fieldKey}':`, originalValue);
          return BigInt(0);
        }

      case 'buffer':
        try {
          if (Buffer.isBuffer(originalValue)) {
            return originalValue;
          } else if (typeof originalValue === 'string') {
            // Assume base64 encoded string
            return Buffer.from(originalValue, 'base64');
          } else if (Array.isArray(originalValue)) {
            // Array of bytes
            return Buffer.from(originalValue);
          } else {
            return Buffer.alloc(0);
          }
        } catch (e) {
          console.error(`Failed to convert to Buffer for field '${fieldKey}':`, originalValue);
          return Buffer.alloc(0);
        }

      case 'uuid':
        // Validate and format UUID
        const uuidValue = originalValue?.toString() || '';
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (uuidRegex.test(uuidValue)) {
          return uuidValue.toLowerCase();
        } else {
          console.warn(`Invalid UUID format for field '${fieldKey}':`, originalValue);
          return uuidValue; // Keep original but warn
        }

      case 'enum':
        // Get enum values from either enumType or enumValues
        let validValues: (string | number)[] = [];

        if (fieldConfig.enumType) {
          validValues = Object.values(fieldConfig.enumType);
        } else if (fieldConfig.enumValues) {
          validValues = [...fieldConfig.enumValues];
        }

        if (validValues.length > 0) {
          // Convert originalValue to appropriate type for comparison
          let valueToCheck = originalValue;

          // If enum contains numbers, try to convert the value to number
          const hasNumbers = validValues.some(v => typeof v === 'number');
          if (hasNumbers && typeof originalValue === 'string' && !isNaN(Number(originalValue))) {
            valueToCheck = Number(originalValue);
          }

          if (validValues.includes(valueToCheck)) {
            return valueToCheck;
          } else {
            console.warn(
              `Invalid enum value '${originalValue}' for field '${fieldKey}'. Expected one of: ${validValues.join(', ')}`
            );
            // Keep original value but log warning
            return originalValue;
          }
        } else {
          // No validation, just pass through
          return originalValue;
        }

      default:
        // Unknown type, pass through unchanged
        return originalValue;
    }
  }

  /**
   * Transform a single field value for database input based on its type configuration
   */
  static transformInputFieldValue(value: any, fieldConfig: FieldConfig, fieldKey: string): any {
    switch (fieldConfig.type) {
      case 'string':
      case 'text':
      case 'uuid':
        // Ensure string conversion
        return value?.toString() || '';

      case 'boolean':
        // Convert to database boolean representation (usually 0/1 or true/false)
        if (typeof value === 'boolean') {
          return value;
        } else if (typeof value === 'string') {
          const lowerValue = value.toLowerCase();
          return (
            lowerValue === 'true' ||
            lowerValue === '1' ||
            lowerValue === 'yes' ||
            lowerValue === 'on'
          );
        } else if (typeof value === 'number') {
          return value !== 0;
        } else {
          return Boolean(value);
        }

      case 'number':
      case 'float':
      case 'decimal':
        value = parseFloat(value);
        if (isNaN(value)) {
          return 0;
        } else if (fieldConfig.type === 'decimal' && fieldConfig.precision !== undefined) {
          return parseFloat(value.toFixed(fieldConfig.precision));
        }
        return value;

      case 'integer':
        value = parseInt(value, 10);
        return isNaN(value) ? 0 : value;

      case 'date':
      case 'datetime':
        if (value instanceof Date) {
          // Keep as Date object for database driver to handle
          return value;
        } else {
          try {
            return new Date(value);
          } catch (e) {
            console.error(`Failed to convert to Date for field '${fieldKey}':`, value);
            return new Date();
          }
        }

      case 'timestamp':
        if (value instanceof Date) {
          // Convert Date to Unix timestamp (seconds)
          return Math.floor(value.getTime() / 1000);
        } else if (typeof value === 'number') {
          // Assume already a timestamp
          return value;
        } else {
          try {
            return Math.floor(new Date(value).getTime() / 1000);
          } catch (e) {
            console.error(`Failed to convert to timestamp for field '${fieldKey}':`, value);
            return Math.floor(Date.now() / 1000);
          }
        }

      case 'json':
      case 'array':
        if (typeof value === 'object') {
          try {
            return JSON.stringify(value);
          } catch (e) {
            console.error(`Failed to stringify JSON/Array for field '${fieldKey}':`, value);
            return fieldConfig.type === 'array' ? '[]' : '{}';
          }
        } else if (typeof value === 'string') {
          // Already a string, validate JSON
          try {
            JSON.parse(value);
            return value;
          } catch (e) {
            console.error(`Invalid JSON string for field '${fieldKey}':`, value);
            return fieldConfig.type === 'array' ? '[]' : '{}';
          }
        }
        return value;

      case 'bigint':
        try {
          if (typeof value === 'bigint') {
            return value.toString();
          } else {
            return BigInt(value).toString();
          }
        } catch (e) {
          console.error(`Failed to convert to BigInt for field '${fieldKey}':`, value);
          return '0';
        }

      case 'buffer':
        if (Buffer.isBuffer(value)) {
          // Convert Buffer to base64 string for database storage
          return value.toString('base64');
        } else if (Array.isArray(value)) {
          // Convert byte array to base64
          return Buffer.from(value).toString('base64');
        } else if (typeof value === 'string') {
          // Assume already base64 encoded
          return value;
        } else {
          console.error(`Invalid buffer data for field '${fieldKey}':`, value);
          return '';
        }

      case 'enum':
        // Enum values are passed through as-is
        // Validation happens on read, not write
        return value;

      default:
        // Unknown type, pass through unchanged
        return value;
    }
  }
}
