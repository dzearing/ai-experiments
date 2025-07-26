(function() {
  const m = "claude-flow-theme", s = "default", A = "auto", f = "@claude-flow/ui-kit/dist/themes/", i = /* @__PURE__ */ new Set();
  function h() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function F(e) {
    return !e || e === "auto" ? h() : e;
  }
  function u() {
    return document.documentElement.getAttribute("data-default-theme") || s;
  }
  async function c(e, n) {
    const t = `${e}-${n}`;
    if (i.has(t))
      return !0;
    try {
      if (document.querySelector(
        `link[data-theme-file="${t}"]`
      ))
        return i.add(t), !0;
      const o = document.createElement("link");
      return o.rel = "stylesheet", o.href = `${f}${t}.css`, o.setAttribute("data-theme-file", t), document.head.appendChild(o), i.add(t), new Promise((d) => {
        o.onload = () => d(!0), o.onerror = () => {
          i.delete(t), console.error(`Failed to load theme file: ${t}`), d(!1);
        };
      });
    } catch (a) {
      return console.error(`Failed to load theme "${e}" (${n}):`, a), !1;
    }
  }
  function T(e, n, t) {
    t = t || document.documentElement, t.classList.add("theme-transitioning"), t.setAttribute("data-theme", e), t.setAttribute("data-theme-type", n), requestAnimationFrame(() => {
      setTimeout(() => {
        t.classList.remove("theme-transitioning");
      }, 50);
    });
  }
  async function r(e, n, t) {
    t = t || document.documentElement;
    const a = F(n);
    if (!await c(e, a) && e !== s && (console.warn("Falling back to default theme"), await c(s, a), e = s), T(e, a, t), t === document.documentElement) {
      try {
        const l = {
          theme: e,
          type: n || "auto",
          // Store original value, not resolved
          timestamp: Date.now()
        };
        localStorage.setItem(m, JSON.stringify(l));
      } catch (l) {
        console.warn("Failed to save theme preferences:", l);
      }
      const d = {
        theme: e,
        type: a,
        requestedType: n || "auto"
      };
      window.dispatchEvent(new CustomEvent("themechange", { detail: d }));
    }
    return !0;
  }
  async function y() {
    const e = u();
    let n = null;
    try {
      const o = localStorage.getItem(m);
      o && (n = JSON.parse(o));
    } catch (o) {
      console.warn("Failed to read theme preferences:", o);
    }
    const t = (n == null ? void 0 : n.theme) || e, a = n == null ? void 0 : n.type;
    await r(t, a);
  }
  const p = u(), g = h();
  document.documentElement.setAttribute("data-theme", p), document.documentElement.setAttribute("data-theme-type", g);
  const w = `${p}-${g}`;
  document.querySelector(
    `link[data-theme-file="${w}"]`
  ) && i.add(w);
  function E() {
    if (window.matchMedia) {
      const e = window.matchMedia("(prefers-color-scheme: dark)"), n = async function() {
        const t = JSON.parse(
          localStorage.getItem(m) || "{}"
        );
        if (!t.type || t.type === "auto") {
          const a = h(), o = t.theme || u();
          await c(o, a), T(o, a);
          const d = {
            theme: o,
            type: a,
            requestedType: "auto",
            reason: "system-change"
          };
          window.dispatchEvent(new CustomEvent("themechange", { detail: d }));
        }
      };
      e.addEventListener ? e.addEventListener("change", n) : "addListener" in e && e.addListener(n);
    }
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", function() {
    y(), E();
  }) : (y(), E());
  async function k(e) {
    const n = [];
    for (const t of e)
      typeof t == "string" ? (n.push(c(t, "light")), n.push(c(t, "dark"))) : n.push(c(t.name, t.type));
    await Promise.all(n);
  }
  const L = {
    // Main theme loading function (type is optional, uses system default)
    loadTheme: r,
    // Preload themes for instant switching
    preloadThemes: k,
    // Apply theme to specific element
    applyThemeToElement: function(e, n, t) {
      return r(n, t, e);
    },
    // Get current theme
    getTheme: function(e) {
      return e = e || document.documentElement, e.getAttribute("data-theme");
    },
    // Get current type
    getThemeType: function(e) {
      return e = e || document.documentElement, e.getAttribute("data-theme-type");
    },
    // Set theme type only (light/dark/auto)
    setThemeType: function(e) {
      const n = this.getTheme();
      return r(n || s, e);
    },
    // Toggle between light and dark
    toggleThemeType: async function() {
      const n = this.getThemeType() === "light" ? "dark" : "light", t = this.getTheme();
      return r(t || s, n);
    },
    // Check if theme file is loaded
    isThemeFileLoaded: function(e, n) {
      return i.has(`${e}-${n}`);
    },
    // Get all loaded theme files
    getLoadedThemeFiles: function() {
      return Array.from(i);
    },
    // Get available themes
    getAvailableThemes: async function() {
      try {
        return (await (await fetch(`${f}theme-manifest.json`)).json()).themes;
      } catch (e) {
        return console.error("Failed to load theme manifest:", e), [];
      }
    },
    // Reset to default
    reset: function() {
      const e = u();
      return r(e, A);
    }
  };
  window.__claudeFlowTheme = L, window.loadTheme = L.loadTheme;
})();
