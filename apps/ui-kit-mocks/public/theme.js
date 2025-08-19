const w = "ui-kit-theme", a = "default", m = "auto", T = () => {
  if (typeof window < "u") {
    if (window.__uiKitBasePath) {
      const o = window.__uiKitBasePath;
      return o.endsWith("/") ? `${o}themes/` : `${o}/themes/`;
    }
    const e = window.location.pathname.includes("/iframe.html") || window.location.port === "6006" || document.querySelector("#storybook-root") !== null || document.querySelector("#storybook-preview-iframe") !== null;
    if (e)
      return "/themes/";
    const t = window.location.pathname;
    if (t.endsWith(".html") && !t.startsWith("/themes/") && !t.startsWith("/assets/") && !e)
      return "assets/themes/";
  }
  return "/themes/";
}, c = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set();
function g() {
  return typeof window < "u" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function E(e) {
  return e === "auto" ? g() : e;
}
function M() {
  return typeof document < "u" && document.documentElement.getAttribute("data-default-theme") || a;
}
async function s(e, t) {
  if (typeof document > "u") return !1;
  const n = `${e}-${t}`;
  if (c.has(n))
    return !0;
  try {
    if (document.querySelector(
      `link[data-theme-file="${n}"]`
    ))
      return c.add(n), !0;
    const i = document.createElement("link");
    return i.rel = "stylesheet", i.href = `${T()}${n}.css`, i.setAttribute("data-theme-file", n), document.head.appendChild(i), c.add(n), new Promise((r) => {
      i.onload = () => r(!0), i.onerror = () => {
        c.delete(n), console.error(`Failed to load theme file: ${n}`), r(!1);
      };
    });
  } catch (o) {
    return console.error(`Failed to load theme "${e}" (${t}):`, o), !1;
  }
}
function p(e, t, n) {
  if (typeof document > "u") return;
  const o = document.documentElement;
  o.classList.add("theme-transitioning"), o.setAttribute("data-theme", e), o.setAttribute("data-theme-mode", t), o.setAttribute("data-theme-type", n), requestAnimationFrame(() => {
    setTimeout(() => {
      o.classList.remove("theme-transitioning");
    }, 50);
  });
}
function S(e, t) {
  if (!(typeof localStorage > "u"))
    try {
      const n = {
        theme: e,
        mode: t,
        timestamp: Date.now()
      };
      localStorage.setItem(w, JSON.stringify(n));
    } catch (n) {
      console.warn("Failed to save theme preferences:", n);
    }
}
function b() {
  if (typeof localStorage > "u") return null;
  try {
    const e = localStorage.getItem(w);
    if (e) {
      const t = JSON.parse(e);
      return {
        theme: t.theme || a,
        mode: t.mode || t.type || m,
        timestamp: t.timestamp || Date.now()
      };
    }
  } catch (e) {
    console.warn("Failed to load theme preferences:", e);
  }
  return null;
}
function y(e) {
  l.forEach((t) => {
    try {
      t(e);
    } catch (n) {
      console.error("Error in theme change listener:", n);
    }
  }), typeof window < "u" && window.dispatchEvent(new CustomEvent("themechange", { detail: e }));
}
async function d(e) {
  const t = u(), n = e.theme ?? t.theme, o = e.mode ?? t.mode, i = E(o), r = await s(n, i);
  return !r && n !== a && (console.warn(`Failed to load theme "${n}", falling back to default`), await s(a, i)), p(r ? n : a, o, i), S(r ? n : a, o), y({
    theme: r ? n : a,
    mode: o,
    effectiveMode: i,
    reason: "manual"
  }), r;
}
function u() {
  if (typeof document > "u")
    return { theme: a, mode: m };
  const e = document.documentElement.getAttribute("data-theme") || a, t = document.documentElement.getAttribute("data-theme-mode") || m;
  return { theme: e, mode: t };
}
function h() {
  return typeof document > "u" ? "light" : document.documentElement.getAttribute("data-theme-type") || g();
}
async function v() {
  try {
    return (await (await fetch(`${T()}theme-manifest.json`)).json()).themes || [];
  } catch (e) {
    return console.error("Failed to load theme manifest:", e), [
      { id: "default", name: "Default", modes: ["light", "dark"] },
      { id: "ocean", name: "Ocean", modes: ["light", "dark"] },
      { id: "forest", name: "Forest", modes: ["light", "dark"] },
      { id: "sunset", name: "Sunset", modes: ["light", "dark"] },
      { id: "corporate", name: "Corporate", modes: ["light", "dark"] },
      { id: "vibrant", name: "Vibrant", modes: ["light", "dark"] },
      { id: "minimal", name: "Minimal", modes: ["light", "dark"] },
      { id: "nature", name: "Nature", modes: ["light", "dark"] },
      { id: "monochrome", name: "Monochrome", modes: ["light", "dark"] },
      { id: "high-contrast", name: "High Contrast", modes: ["light", "dark"] },
      { id: "midnight", name: "Midnight", modes: ["light", "dark"] },
      { id: "spring", name: "Spring", modes: ["light", "dark"] },
      { id: "autumn", name: "Autumn", modes: ["light", "dark"] },
      { id: "arctic", name: "Arctic", modes: ["light", "dark"] },
      { id: "retro", name: "Retro", modes: ["light", "dark"] }
    ];
  }
}
async function f() {
  const e = b(), t = e?.theme || M(), n = e?.mode || m;
  await d({ theme: t, mode: n });
}
async function A() {
  await d({ theme: M(), mode: m });
}
async function k() {
  const t = h() === "light" ? "dark" : "light";
  await d({ mode: t });
}
function L(e) {
  return l.add(e), () => {
    l.delete(e);
  };
}
async function F(e) {
  const t = [];
  for (const n of e)
    t.push(s(n, "light")), t.push(s(n, "dark"));
  await Promise.all(t);
}
if (typeof window < "u" && window.matchMedia) {
  const e = window.matchMedia("(prefers-color-scheme: dark)"), t = async () => {
    const { mode: n } = u();
    if (n === "auto") {
      const { theme: o } = u(), i = g();
      await s(o, i), p(o, "auto", i), y({
        theme: o,
        mode: "auto",
        effectiveMode: i,
        reason: "system"
      });
    }
  };
  e.addEventListener ? e.addEventListener("change", t) : "addListener" in e && e.addListener(t);
}
typeof window < "u" && window.addEventListener("storage", async (e) => {
  if (e.key === w && e.newValue)
    try {
      const t = JSON.parse(e.newValue), n = E(t.mode);
      await s(t.theme, n), p(t.theme, t.mode, n), y({
        theme: t.theme,
        mode: t.mode,
        effectiveMode: n,
        reason: "storage"
      });
    } catch (t) {
      console.error("Failed to apply theme from storage event:", t);
    }
});
if (typeof window < "u") {
  const e = {
    setTheme: d,
    getTheme: u,
    getEffectiveMode: h,
    getAvailableThemes: v,
    init: f,
    reset: A,
    toggleMode: k,
    subscribe: L,
    preloadThemes: F,
    // Backwards compatibility aliases
    loadTheme: (t, n) => d({ theme: t, mode: n }),
    setThemeType: (t) => d({ mode: t }),
    toggleThemeType: k,
    getThemeType: h
  };
  window.__uiKitTheme = e, window.uiKitTheme = e;
}
typeof window < "u" && typeof document < "u" && (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => {
  f();
}) : f());
export {
  v as getAvailableThemes,
  h as getEffectiveMode,
  u as getTheme,
  f as init,
  F as preloadThemes,
  A as reset,
  d as setTheme,
  L as subscribe,
  k as toggleMode
};
