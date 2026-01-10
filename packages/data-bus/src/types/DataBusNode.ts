import type { DataBusChangeFunction } from './DataBusChangeFunction.js';
import type { DataBusProvider } from './DataBusProvider.js';

export interface DataBusNode {
  name?: string;
  value?: unknown;
  providers?: DataBusProvider[];
  activeProviders?: Record<string, { provider: DataBusProvider; count: number }>;
  subscribers?: Set<DataBusChangeFunction>;
  children?: Record<string, DataBusNode>;
}
