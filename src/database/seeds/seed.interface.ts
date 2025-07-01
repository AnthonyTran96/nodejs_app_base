export interface Seed {
  readonly name: string;
  readonly order: number;
  run(): Promise<void>;
} 