import 'reflect-metadata';
import { Constructor } from '../types/common';

export interface ServiceMetadata {
  token: string | symbol;
  factory?: () => unknown;
  singleton?: boolean;
  dependencies?: (string | symbol)[];
}

export class Container {
  private static instance: Container;
  private readonly services = new Map<string | symbol, unknown>();
  private readonly metadata = new Map<string | symbol, ServiceMetadata>();

  private constructor() {}

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  async initialize(): Promise<void> {
    // Initialize all registered services
    for (const [token, meta] of this.metadata) {
      if (meta.singleton && !this.services.has(token)) {
        await this.resolve(token);
      }
    }
  }

  register<T>(
    token: string | symbol,
    implementation: Constructor<T> | (() => T),
    options: { singleton?: boolean; dependencies?: (string | symbol)[] } = {}
  ): void {
    const metadata: ServiceMetadata = {
      token,
      singleton: options.singleton ?? true,
      dependencies: options.dependencies ?? [],
    };

    if (typeof implementation === 'function' && implementation.prototype) {
      // Constructor function
      metadata.factory = () => new (implementation as Constructor<T>)();
    } else {
      // Factory function
      metadata.factory = implementation as () => T;
    }

    this.metadata.set(token, metadata);
  }

  async resolve<T>(token: string | symbol): Promise<T> {
    const meta = this.metadata.get(token);
    if (!meta) {
      throw new Error(`Service not registered: ${String(token)}`);
    }

    if (meta.singleton && this.services.has(token)) {
      return this.services.get(token) as T;
    }

    if (!meta.factory) {
      throw new Error(`No factory found for service: ${String(token)}`);
    }

    // Resolve dependencies
    const dependencies = [];
    if (meta.dependencies) {
      for (const dep of meta.dependencies) {
        dependencies.push(await this.resolve(dep));
      }
    }

    const instance = meta.factory();
    
    if (meta.singleton) {
      this.services.set(token, instance);
    }

    return instance as T;
  }

  get<T>(token: string | symbol): T {
    const instance = this.services.get(token);
    if (!instance) {
      throw new Error(`Service not found: ${String(token)}`);
    }
    return instance as T;
  }

  clear(): void {
    this.services.clear();
    this.metadata.clear();
  }
}

// Decorators for dependency injection
export function Injectable(token?: string | symbol): ClassDecorator {
  return function (target: any): any {
    const serviceToken = token || target.name;
    const container = Container.getInstance();
    container.register(serviceToken, target);
    return target;
  };
}

export function Service(token?: string | symbol): ClassDecorator {
  return Injectable(token);
} 