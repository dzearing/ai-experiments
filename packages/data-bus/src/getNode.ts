import { createNode } from './createNode.js';
import type { DataBusNode } from './types/DataBusNode.js';
import type { DataBusState } from './types/DataBusState.js';

export function getNode(
  state: DataBusState,
  path: string[],
): {
  node: DataBusNode;
  nodePath: DataBusNode[];
};

export function getNode(
  state: DataBusState,
  path: string[],
  createPath: true,
): {
  node: DataBusNode;
  nodePath: DataBusNode[];
};

export function getNode(
  state: DataBusState,
  path: string[],
  createPath?: boolean,
): {
  node: DataBusNode | undefined;
  nodePath: DataBusNode[];
} {
  let index = 0;
  let node: DataBusNode | undefined = state.root;
  const nodePath: DataBusNode[] = [state.root];

  while (node && index < path.length) {
    const pathName = path[index++];

    if (!node.children?.[pathName] && createPath) {
      node.children ??= {};
      node.children[pathName] = createNode(pathName);
    }

    node = node.children?.[pathName];
    node && nodePath.push(node);
  }

  return {
    node,
    nodePath,
  };
}
