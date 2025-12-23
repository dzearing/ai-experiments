import '@testing-library/jest-dom/vitest';

// Mock DataTransfer for paste tests
class DataTransferMock implements Partial<DataTransfer> {
  private data: Map<string, string> = new Map();
  items: DataTransferItemList = [] as unknown as DataTransferItemList;
  files: FileList = [] as unknown as FileList;
  dropEffect: DataTransfer['dropEffect'] = 'none';
  effectAllowed: DataTransfer['effectAllowed'] = 'uninitialized';
  types: readonly string[] = [];

  getData(format: string): string {
    return this.data.get(format) || '';
  }

  setData(format: string, value: string): void {
    this.data.set(format, value);
  }

  clearData(): void {
    this.data.clear();
  }

  setDragImage(): void {}
}

// Mock ClipboardEvent for paste tests
class ClipboardEventMock extends Event {
  clipboardData: DataTransfer;

  constructor(type: string, eventInitDict?: ClipboardEventInit & { clipboardData?: unknown }) {
    super(type, eventInitDict);
    // Create a DataTransferMock and copy over items if provided
    const mock = new DataTransferMock();
    if (eventInitDict?.clipboardData && typeof eventInitDict.clipboardData === 'object') {
      const provided = eventInitDict.clipboardData as { items?: Array<{ type: string; getAsFile: () => File | null }> };
      if (provided.items) {
        mock.items = provided.items as unknown as DataTransferItemList;
      }
    }
    this.clipboardData = mock as unknown as DataTransfer;
  }
}

if (typeof global.ClipboardEvent === 'undefined') {
  global.ClipboardEvent = ClipboardEventMock as typeof ClipboardEvent;
}

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
  getBoundingClientRect: () => ({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }),
  getClientRects: () => [],
  cloneRange: function() { return this; },
  cloneContents: () => document.createDocumentFragment(),
  commonAncestorContainer: document,
  compareBoundaryPoints: () => 0,
  comparePoint: () => 0,
  createContextualFragment: () => document.createDocumentFragment(),
  detach: () => {},
  endContainer: document,
  endOffset: 0,
  extractContents: () => document.createDocumentFragment(),
  intersectsNode: () => true,
  isPointInRange: () => true,
  startContainer: document,
  startOffset: 0,
  surroundContents: () => {},
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
  type: 'Caret',
  direction: 'none',
  collapse: () => {},
  containsNode: () => false,
  deleteFromDocument: () => {},
  empty: () => {},
  extend: () => {},
  getComposedRanges: () => [],
  modify: () => {},
  setBaseAndExtent: () => {},
  selectAllChildren: () => {},
  setPosition: () => {},
  toString: () => '',
};

Object.defineProperty(window, 'getSelection', {
  value: () => mockSelection,
  writable: true,
});

// Mock document.execCommand for contenteditable
document.execCommand = () => false;

// Mock document.elementFromPoint for ProseMirror/TipTap
document.elementFromPoint = () => null;

// Mock element.getClientRects and getBoundingClientRect for ProseMirror/TipTap
const mockDOMRect = () => ({
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: 0,
  height: 0,
  x: 0,
  y: 0,
  toJSON: () => ({}),
});

const mockDOMRectList = () => {
  const list: DOMRect[] = [];
  return Object.assign(list, {
    item: (index: number) => list[index] || null,
    length: 0,
  });
};

// Override Element prototype methods for TipTap/ProseMirror
const originalGetClientRects = Element.prototype.getClientRects;
Element.prototype.getClientRects = function() {
  try {
    return originalGetClientRects.call(this);
  } catch {
    return mockDOMRectList() as DOMRectList;
  }
};

const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
Element.prototype.getBoundingClientRect = function() {
  try {
    return originalGetBoundingClientRect.call(this);
  } catch {
    return mockDOMRect() as DOMRect;
  }
};

// Mock Range.prototype methods for TipTap/ProseMirror
const originalRangeGetClientRects = Range.prototype.getClientRects;
Range.prototype.getClientRects = function() {
  try {
    return originalRangeGetClientRects.call(this);
  } catch {
    return mockDOMRectList() as DOMRectList;
  }
};

const originalRangeGetBoundingClientRect = Range.prototype.getBoundingClientRect;
Range.prototype.getBoundingClientRect = function() {
  try {
    return originalRangeGetBoundingClientRect.call(this);
  } catch {
    return mockDOMRect() as DOMRect;
  }
};

// Mock scrollIntoView for TipTap/ProseMirror
Element.prototype.scrollIntoView = function() {};

// Mock createRange with all necessary methods
const originalCreateRange = document.createRange;
document.createRange = function() {
  try {
    const range = originalCreateRange.call(this);
    // Ensure the range has getClientRects
    if (!range.getClientRects) {
      range.getClientRects = () => mockDOMRectList() as DOMRectList;
    }
    return range;
  } catch {
    return mockRange as unknown as Range;
  }
};

// Mock MutationObserver for TipTap/ProseMirror
class MutationObserverMock {
  observe() {}
  disconnect() {}
  takeRecords() { return []; }
}

if (typeof global.MutationObserver === 'undefined') {
  global.MutationObserver = MutationObserverMock as typeof MutationObserver;
}

// Mock document.caretRangeFromPoint for TipTap/ProseMirror
Object.defineProperty(document, 'caretRangeFromPoint', {
  value: () => null,
  writable: true,
});

// Mock caretPositionFromPoint for TipTap/ProseMirror
Object.defineProperty(document, 'caretPositionFromPoint', {
  value: () => null,
  writable: true,
});
