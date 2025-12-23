import '@testing-library/jest-dom/vitest';

// Mock matchMedia for @ui-kit/core bootstrap
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver for tests
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

// Mock URL.createObjectURL and URL.revokeObjectURL for image handling tests
global.URL.createObjectURL = () => 'blob:mock-url';
global.URL.revokeObjectURL = () => {};

// Mock window.getSelection for contenteditable tests
const mockRange = {
  deleteContents: () => {},
  insertNode: () => {},
  collapse: () => {},
  setStart: () => {},
  setEnd: () => {},
  setStartAfter: () => {},
  setEndAfter: () => {},
  selectNodeContents: () => {},
  selectNode: () => {},
  toString: () => '',
};

const mockSelection = {
  anchorNode: null,
  anchorOffset: 0,
  focusNode: null,
  focusOffset: 0,
  isCollapsed: true,
  rangeCount: 1,
  getRangeAt: () => mockRange,
  removeAllRanges: () => {},
  addRange: () => {},
  collapseToEnd: () => {},
};

Object.defineProperty(window, 'getSelection', {
  value: () => mockSelection,
  writable: true,
});

// Mock document.execCommand for contenteditable
document.execCommand = () => false;
