// Valid TypeScript code for testing successful build
export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}

export interface Calculator {
  add(a: number, b: number): number;
  subtract(a: number, b: number): number;
}

export class SimpleCalculator implements Calculator {
  add(a: number, b: number): number {
    return add(a, b);
  }

  subtract(a: number, b: number): number {
    return subtract(a, b);
  }
}
