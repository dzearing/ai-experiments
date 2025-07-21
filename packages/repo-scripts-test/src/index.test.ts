import { add, subtract, SimpleCalculator } from './index';

describe('Calculator Functions', () => {
  describe('add', () => {
    test('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });

    test('should add negative numbers', () => {
      expect(add(-5, -3)).toBe(-8);
    });

    test('should add zero correctly', () => {
      expect(add(10, 0)).toBe(10);
      expect(add(0, 0)).toBe(0);
    });

    test('should handle decimal numbers', () => {
      expect(add(0.1, 0.2)).toBeCloseTo(0.3);
    });
  });

  describe('subtract', () => {
    test('should subtract two positive numbers', () => {
      expect(subtract(5, 3)).toBe(2);
    });

    test('should subtract negative numbers', () => {
      expect(subtract(-5, -3)).toBe(-2);
    });

    test('should subtract zero correctly', () => {
      expect(subtract(10, 0)).toBe(10);
      expect(subtract(0, 5)).toBe(-5);
    });
  });
});

describe('SimpleCalculator Class', () => {
  let calculator: SimpleCalculator;

  beforeEach(() => {
    calculator = new SimpleCalculator();
  });

  test('should create an instance', () => {
    expect(calculator).toBeInstanceOf(SimpleCalculator);
  });

  test('should add numbers using the add method', () => {
    expect(calculator.add(10, 5)).toBe(15);
  });

  test('should subtract numbers using the subtract method', () => {
    expect(calculator.subtract(10, 5)).toBe(5);
  });

  test('should handle negative results', () => {
    expect(calculator.subtract(5, 10)).toBe(-5);
  });
});
