import { describe, it, expect } from 'vitest';
import { rgbToHex } from './rgbToHex.js';

describe('rgbToHex', () => {
  it('converts RGB to hex color', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000');
    expect(rgbToHex({ r: 0, g: 255, b: 0 })).toBe('#00ff00');
    expect(rgbToHex({ r: 0, g: 0, b: 255 })).toBe('#0000ff');
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff');
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
  });

  it('pads single digit hex values with zero', () => {
    expect(rgbToHex({ r: 15, g: 15, b: 15 })).toBe('#0f0f0f');
    expect(rgbToHex({ r: 1, g: 2, b: 3 })).toBe('#010203');
  });

  it('clamps values outside 0-255 range', () => {
    expect(rgbToHex({ r: -10, g: 300, b: 128 })).toBe('#00ff80');
    expect(rgbToHex({ r: -100, g: -50, b: -25 })).toBe('#000000');
    expect(rgbToHex({ r: 300, g: 400, b: 500 })).toBe('#ffffff');
  });

  it('rounds decimal values', () => {
    expect(rgbToHex({ r: 127.4, g: 127.5, b: 127.6 })).toBe('#7f8080');
    expect(rgbToHex({ r: 0.4, g: 0.5, b: 0.6 })).toBe('#000101');
  });
});
