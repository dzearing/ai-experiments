import type { DataBusChangeFunction } from './DataBusChangeFunction.js';
import type { DisposeFunction } from './DisposeFunction.js';
import type { DataBusProvider } from './DataBusProvider.js';
import type { DataBusPath } from './DataBusPath.js';
import type { z } from 'zod';

export interface DataBus {
  publish<TData = unknown>(path: string[], value: TData): void;
  publish<TZodData extends z.ZodType>(path: DataBusPath<TZodData>, value: z.infer<TZodData>): void;

  subscribe<TData = unknown>(path: string[], callback: DataBusChangeFunction<TData>): DisposeFunction;
  subscribe<TZodData extends z.ZodType>(
    path: DataBusPath<TZodData>,
    callback: DataBusChangeFunction<z.infer<TZodData>>,
  ): DisposeFunction;

  getData<TData = unknown>(path: string[]): TData | undefined;
  getData<TZodData extends z.ZodType>(path: DataBusPath<TZodData>): z.infer<TZodData> | undefined;

  addProvider: (provider: DataBusProvider) => void;

  dispose: () => void;
}
