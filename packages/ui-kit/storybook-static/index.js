const r = class r {
  constructor() {
    this.listeners = [], typeof window < "u" && (window.addEventListener("storage", this.handleStorageChange.bind(this)), window.addEventListener("themechange", this.handleThemeChange.bind(this)));
  }
  /**
   * Get the current theme ID
   */
  get currentTheme() {
    return typeof document > "u" ? r.DEFAULT_THEME : document.documentElement.getAttribute("data-theme") || r.DEFAULT_THEME;
  }
  /**
   * Get the current mode
   */
  get currentMode() {
    return typeof document > "u" ? r.DEFAULT_MODE : document.documentElement.getAttribute("data-mode") || this.getEffectiveMode();
  }
  /**
   * Get list of available themes
   */
  get themes() {
    return [
      {
        id: "default",
        name: "Default",
        description: "Clean and professional",
        colors: { primary: "#03a9f4", secondary: "#9c27b0" }
      },
      {
        id: "corporate",
        name: "Corporate",
        description: "Business-focused design",
        colors: { primary: "#0078d4", secondary: "#40587c" }
      },
      {
        id: "vibrant",
        name: "Vibrant",
        description: "Bold and energetic",
        colors: { primary: "#ff4081", secondary: "#7c4dff" }
      },
      {
        id: "minimal",
        name: "Minimal",
        description: "Simple and understated",
        colors: { primary: "#607d8b", secondary: "#795548" }
      },
      {
        id: "nature",
        name: "Nature",
        description: "Earth tones and greens",
        colors: { primary: "#4caf50", secondary: "#8bc34a" }
      },
      {
        id: "ocean",
        name: "Ocean",
        description: "Cool blues and aquas",
        colors: { primary: "#00bcd4", secondary: "#0097a7" }
      },
      {
        id: "sunset",
        name: "Sunset",
        description: "Warm oranges and reds",
        colors: { primary: "#ff5722", secondary: "#ff9800" }
      },
      {
        id: "monochrome",
        name: "Monochrome",
        description: "Grayscale only",
        colors: { primary: "#616161", secondary: "#424242" }
      }
    ];
  }
  /**
   * Set the current theme
   */
  setTheme(e) {
    var n;
    const t = ((n = this.getStoredPreferences()) == null ? void 0 : n.mode) || r.DEFAULT_MODE;
    this.applyTheme(e, t);
  }
  /**
   * Set the current mode
   */
  setMode(e) {
    const t = this.currentTheme;
    this.applyTheme(t, e);
  }
  /**
   * Reset to default theme and mode
   */
  reset() {
    this.applyTheme(r.DEFAULT_THEME, r.DEFAULT_MODE);
  }
  /**
   * Subscribe to theme changes
   */
  on(e, t) {
    this.listeners.push(t);
  }
  /**
   * Unsubscribe from theme changes
   */
  off(e, t) {
    this.listeners = this.listeners.filter((n) => n !== t);
  }
  /**
   * Export current theme as CSS
   */
  exportAsCSS() {
    const e = this.currentTheme, t = this.currentMode;
    return `/* Theme: ${e}, Mode: ${t} */
/* Generated CSS would go here */`;
  }
  /**
   * Create a custom theme
   */
  createCustomTheme(e) {
    return {
      id: e.id || `custom-${Date.now()}`,
      name: e.name || "Custom Theme",
      description: e.description || "A custom theme",
      colors: e.colors || { primary: "#03a9f4", secondary: "#9c27b0" }
    };
  }
  applyTheme(e, t) {
    if (typeof window > "u") return;
    const n = window.__claudeFlowTheme;
    n && n.setTheme(e, t), this.notifyListeners({ theme: e, mode: t });
  }
  getStoredPreferences() {
    if (typeof localStorage > "u") return null;
    try {
      const e = localStorage.getItem(r.STORAGE_KEY);
      return e ? JSON.parse(e) : null;
    } catch {
      return null;
    }
  }
  getEffectiveMode() {
    const e = this.getStoredPreferences();
    return e != null && e.mode && e.mode !== "auto" ? e.mode : typeof window < "u" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  handleStorageChange(e) {
    if (e.key === r.STORAGE_KEY && e.newValue)
      try {
        const t = JSON.parse(e.newValue);
        this.applyTheme(t.theme, t.mode);
      } catch {
      }
  }
  handleThemeChange(e) {
    const t = e;
    this.notifyListeners(t.detail);
  }
  notifyListeners(e) {
    this.listeners.forEach((t) => {
      try {
        t(e);
      } catch (n) {
        console.error("Error in theme change listener:", n);
      }
    });
  }
};
r.STORAGE_KEY = "claude-flow-theme", r.DEFAULT_THEME = "default", r.DEFAULT_MODE = "auto";
let s = r;
const h = new s();
class a extends HTMLElement {
  constructor() {
    super(), this.themeStylesheet = null, this.baseStylesheet = null, this.shadow = this.attachShadow({ mode: "open" });
  }
  static get observedAttributes() {
    return ["theme", "mode"];
  }
  connectedCallback() {
    this.loadTheme();
  }
  attributeChangedCallback(e, t, n) {
    t !== n && (e === "theme" || e === "mode") && this.loadTheme();
  }
  async loadTheme() {
    const e = this.getAttribute("theme") || "default", t = this.getAttribute("mode") || "light";
    this.shadow.innerHTML = "";
    const n = document.createElement("div");
    n.setAttribute("data-theme", e), n.setAttribute("data-theme-type", t), n.className = "theme-preview-wrapper", this.baseStylesheet || (this.baseStylesheet = document.createElement("link"), this.baseStylesheet.rel = "stylesheet", this.baseStylesheet.href = "/styles.css"), this.themeStylesheet && this.themeStylesheet.remove(), this.themeStylesheet = document.createElement("link"), this.themeStylesheet.rel = "stylesheet", this.themeStylesheet.href = `/themes/${e}-${t}.css`;
    const i = document.createElement("style");
    i.textContent = `
      :host {
        display: block;
      }
      
      .theme-preview-wrapper {
        /* Ensure the wrapper takes full space */
        width: 100%;
        height: 100%;
        /* Apply base styles that would normally be on body */
        font-family: var(--font-family);
        font-size: var(--font-size-body);
        line-height: var(--line-height-normal);
        color: var(--color-body-text);
        background-color: var(--color-body-background);
      }
      
      /* Reset any inherited styles */
      .theme-preview-wrapper * {
        all: initial;
        font-family: inherit;
      }
    `;
    const d = document.createElement("slot");
    n.appendChild(d), this.shadow.appendChild(this.baseStylesheet.cloneNode()), this.shadow.appendChild(this.themeStylesheet), this.shadow.appendChild(i), this.shadow.appendChild(n);
  }
}
typeof window < "u" && !customElements.get("theme-preview") && customElements.define("theme-preview", a);
const c = {
  /**
   * Initialize the UI kit (applies theme from localStorage)
   */
  init() {
    if (typeof window < "u" && window.__claudeFlowTheme) {
      const o = localStorage.getItem("claude-flow-theme");
      if (o)
        try {
          const e = JSON.parse(o);
          window.__claudeFlowTheme.setTheme(e.theme, e.mode);
        } catch {
        }
    }
  },
  /**
   * Get current theme
   */
  getCurrentTheme() {
    return typeof document > "u" ? "default" : document.documentElement.getAttribute("data-theme") || "default";
  },
  /**
   * Get current mode
   */
  getCurrentMode() {
    return typeof document > "u" ? "light" : document.documentElement.getAttribute("data-mode") || "light";
  },
  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion() {
    return typeof window > "u" ? !1 : window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  },
  /**
   * Check if user prefers dark mode
   */
  prefersDarkMode() {
    return typeof window > "u" ? !1 : window.matchMedia("(prefers-color-scheme: dark)").matches;
  },
  /**
   * Get CSS variable value
   */
  getCSSVariable(o) {
    return typeof window > "u" ? "" : window.getComputedStyle(document.documentElement).getPropertyValue(o).trim();
  },
  /**
   * Set CSS variable value
   */
  setCSSVariable(o, e) {
    typeof document > "u" || document.documentElement.style.setProperty(o, e);
  }
};
export {
  s as ThemeManager,
  a as ThemePreview,
  c as UIKit,
  h as themeManager
};
