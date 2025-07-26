import { describe, it, expect } from 'vitest';
import { parseColor } from './parseColor.js';

describe('parseColor', () => {
  it('parses RGB objects', () => {
    const rgb = { r: 255, g: 128, b: 0 };
    expect(parseColor(rgb)).toBe(rgb);
  });

  it('parses hex colors with hash', () => {
    expect(parseColor('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColor('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    expect(parseColor('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('parses hex colors without hash', () => {
    expect(parseColor('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColor('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    expect(parseColor('0000ff')).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('parses rgb() format', () => {
    expect(parseColor('rgb(255, 0, 0)')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColor('rgb(0, 255, 0)')).toEqual({ r: 0, g: 255, b: 0 });
    expect(parseColor('rgb(0, 0, 255)')).toEqual({ r: 0, g: 0, b: 255 });
    expect(parseColor('rgb(128,128,128)')).toEqual({ r: 128, g: 128, b: 128 });
  });

  it('handles rgb() with extra spaces', () => {
    expect(parseColor('rgb(255,   0,   0)')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColor('rgb( 128 , 128 , 128 )')).toEqual({ r: 128, g: 128, b: 128 });
  });

  it('parses hsl() format', () => {
    expect(parseColor('hsl(0, 100%, 50%)')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColor('hsl(120, 100%, 50%)')).toEqual({ r: 0, g: 255, b: 0 });
    expect(parseColor('hsl(240, 100%, 50%)')).toEqual({ r: 0, g: 0, b: 255 });
    expect(parseColor('hsl(0, 0%, 50%)')).toEqual({ r: 128, g: 128, b: 128 });
  });

  it('parses rgba() format', () => {
    expect(parseColor('rgba(255, 0, 0, 0.5)')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColor('rgba(0, 255, 0, 1)')).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('parses hsla() format', () => {
    expect(parseColor('hsla(0, 100%, 50%, 0.5)')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColor('hsla(120, 100%, 50%, 1)')).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('throws error for unsupported formats', () => {
    expect(() => parseColor('red')).toThrow('Unsupported color format');
    expect(() => parseColor('cmyk(100, 0, 0, 0)')).toThrow('Unsupported color format');
  });
});
