import type { DataBusNode } from './types/DataBusNode.js';

export function createNode(name = ''): DataBusNode {
  return {
    name,
  };
}
