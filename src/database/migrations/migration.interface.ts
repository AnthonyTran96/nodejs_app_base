export interface Migration {
  readonly version: string;
  readonly name: string;
  up(): Promise<void>;
  down(): Promise<void>;
}

export interface MigrationRecord {
  version: string;
  name: string;
  executed_at: Date;
} 