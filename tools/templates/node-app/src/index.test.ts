import { describe, it, expect, vi } from 'vitest';
import { main } from './index.js';

describe('main', () => {
  it('should log hello message', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    main();
    
    expect(consoleSpy).toHaveBeenCalledWith('Hello from {{name}}!');
    
    consoleSpy.mockRestore();
  });
});