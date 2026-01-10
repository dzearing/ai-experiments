import type { DataBus } from './DataBus.js';

export interface DataBusProvider<TData = unknown> {
  path: string[];

  onActivate?: (options: { path: string[]; bus: DataBus }) => void;
  onDeactivate?: (options: { path: string[]; bus: DataBus }) => void;
  onPublish?: (options: { value: TData; oldValue: TData; path: string[]; bus: DataBus }) => TData | undefined;
}
