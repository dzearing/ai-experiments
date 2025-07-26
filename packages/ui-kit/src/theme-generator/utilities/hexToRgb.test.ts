import { describe, it, expect } from 'vitest';
import { hexToRgb } from './hexToRgb.js';

describe('hexToRgb', () => {
  it('converts hex color with hash to RGB', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('converts hex color without hash to RGB', () => {
    expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb('0000ff')).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('handles lowercase and uppercase hex', () => {
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#aAbBcC')).toEqual({ r: 170, g: 187, b: 204 });
  });

  it('throws error for invalid hex colors', () => {
    expect(() => hexToRgb('#ff00')).toThrow('Invalid hex color: #ff00');
    expect(() => hexToRgb('gggggg')).toThrow('Invalid hex color: gggggg');
    expect(() => hexToRgb('#ff00gg')).toThrow('Invalid hex color: #ff00gg');
    expect(() => hexToRgb('')).toThrow('Invalid hex color: ');
  });
});
