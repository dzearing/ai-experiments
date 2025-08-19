const s = () => {
  const t = window.__uiKitTheme || window.uiKitTheme;
  if (!t)
    throw new Error("Theme API not found. Please ensure theme.js is loaded before theme-switcher.js");
  return t;
}, h = [
  "default",
  "ocean",
  "sunset",
  "nature",
  "minimal",
  "vibrant",
  "corporate",
  "monochrome",
  "forest",
  "arctic",
  "autumn",
  "spring",
  "midnight",
  "retro",
  "high-contrast"
];

// Load saved state from localStorage
function loadSavedState() {
  const saved = localStorage.getItem('themeSwitcherState');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Handle old format migration
      if (parsed.position && !parsed.expandedPosition) {
        return {
          minimized: parsed.minimized || true,
          minimizedPosition: { x: 50, y: 95 },
          expandedPosition: parsed.position
        };
      }
      // Ensure we have all required fields
      return {
        minimized: parsed.minimized !== undefined ? parsed.minimized : true,
        minimizedPosition: parsed.minimizedPosition || { x: 50, y: 95 },
        expandedPosition: parsed.expandedPosition || { x: 50, y: 80 }
      };
    } catch {}
  }
  return {
    minimized: true,
    minimizedPosition: { x: 50, y: 95 }, // Default bottom center for minimized
    expandedPosition: { x: 50, y: 80 } // Default expanded position
  };
}

// Save state to localStorage
function saveState(state) {
  localStorage.setItem('themeSwitcherState', JSON.stringify(state));
}

function m(t = {}) {
  const { compact: r = !1 } = t;
  const savedState = loadSavedState();
  let isMinimized = savedState.minimized;
  // Use saved positions for both states
  let position = isMinimized 
    ? (savedState.minimizedPosition || { x: 50, y: 95 })
    : (savedState.expandedPosition || { x: 50, y: 80 });
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  
  const a = document.createElement("div");
  a.id = "ui-kit-theme-switcher";
  
  function updatePosition() {
    a.style.left = `${position.x}%`;
    a.style.top = `${position.y}%`;
    a.style.transform = 'translate(-50%, -50%)';
  }
  
  function renderMinimized() {
    a.innerHTML = `
      <style>
        #ui-kit-theme-switcher {
          position: fixed;
          z-index: 10000;
        }
        
        .theme-switcher-minimized {
          width: 36px;
          height: 36px;
          background: var(--color-panel-background, rgba(255, 255, 255, 0.95));
          border: 1px solid var(--color-panel-border, #e0e0e0);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: var(--shadow-card, 0 2px 10px rgba(0, 0, 0, 0.1));
        }
        
        .theme-switcher-minimized.hoverable {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .theme-switcher-minimized.hoverable:hover {
          transform: scale(1.1);
          box-shadow: var(--shadow-cardHover, 0 4px 20px rgba(0, 0, 0, 0.15));
        }
        
        .theme-switcher-minimized.hoverable:active {
          transform: scale(0.95);
        }
        
        [data-theme-type="dark"] .theme-switcher-minimized {
          background: var(--color-panel-background, rgba(30, 30, 30, 0.95));
          border-color: var(--color-panel-border, #444);
        }
        
        .lightbulb-icon {
          width: 20px;
          height: 20px;
          color: var(--color-body-text, #333);
        }
        
        [data-theme-type="dark"] .lightbulb-icon {
          color: var(--color-body-text, #fff);
        }
      </style>
      
      <div class="theme-switcher-minimized" title="Click to open theme switcher">
        <svg class="lightbulb-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
    `;
    
    const minimizedBtn = a.querySelector('.theme-switcher-minimized');
    let isClick = true;
    let dragStartTime = 0;
    
    // Add hoverable class by default
    minimizedBtn.classList.add('hoverable');
    
    // Handle drag for minimized state
    minimizedBtn.addEventListener('mousedown', (e) => {
      isClick = true;
      dragStartTime = Date.now();
      isDragging = true;
      
      // Remove hoverable class when starting drag
      minimizedBtn.classList.remove('hoverable');
      
      const rect = minimizedBtn.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left - rect.width / 2;
      dragOffset.y = e.clientY - rect.top - rect.height / 2;
      
      function handleDrag(e) {
        if (!isDragging) return;
        
        // If we've moved more than 5px or held for more than 150ms, it's a drag not a click
        if (Math.abs(e.movementX) > 5 || Math.abs(e.movementY) > 5 || Date.now() - dragStartTime > 150) {
          isClick = false;
        }
        
        const x = ((e.clientX - dragOffset.x) / window.innerWidth) * 100;
        const y = ((e.clientY - dragOffset.y) / window.innerHeight) * 100;
        
        // Keep element on screen - account for 36px size and centering transform
        // Since we use translate(-50%, -50%), we need half the element size as margin
        const elementSizePercent = {
          x: (18 / window.innerWidth) * 100,  // Half of 36px width
          y: (18 / window.innerHeight) * 100  // Half of 36px height
        };
        
        position.x = Math.max(elementSizePercent.x, Math.min(100 - elementSizePercent.x, x));
        position.y = Math.max(elementSizePercent.y, Math.min(100 - elementSizePercent.y, y));
        
        updatePosition();
      }
      
      function handleMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', handleMouseUp);
        
        // Re-add hoverable class after drag ends
        setTimeout(() => {
          if (minimizedBtn) minimizedBtn.classList.add('hoverable');
        }, 50);
        
        if (!isClick) {
          // Save the new minimized position after dragging
          const saved = loadSavedState();
          saveState({
            ...saved,
            minimized: true,
            minimizedPosition: position
          });
        } else {
          // It was a click, expand the window
          isMinimized = false;
          const saved = loadSavedState();
          const targetPosition = saved.expandedPosition || { x: 50, y: 80 };
          
          // Fade out and scale down the lightbulb
          a.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
          a.style.opacity = '0';
          a.style.transform = 'translate(-50%, -50%) scale(0.8)';
          
          // After fade out, switch to expanded and fade in
          setTimeout(() => {
            position = targetPosition;
            updatePosition();
            saveState({ ...saved, minimized: false });
            
            // Render expanded content
            renderExpanded();
            
            // Start with opacity 0 and slightly scaled down
            a.style.transition = 'none';
            a.style.opacity = '0';
            a.style.transform = 'translate(-50%, -50%) scale(0.9)';
            
            // Force reflow
            a.offsetHeight;
            
            // Fade in and scale to normal
            a.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            a.style.opacity = '1';
            a.style.transform = 'translate(-50%, -50%) scale(1)';
            
            // Clean up after animation
            setTimeout(() => {
              a.style.transition = '';
              a.style.opacity = '';
              a.style.transform = 'translate(-50%, -50%)';
            }, 300);
          }, 200);
        }
      }
      
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleMouseUp);
      e.preventDefault();
    });
  }
  
  function renderExpanded() {
    a.innerHTML = `
      <style>
        #ui-kit-theme-switcher {
          position: fixed;
          z-index: 10000;
          width: 280px;
          background: var(--color-panel-background, rgba(255, 255, 255, 0.95));
          border: 1px solid var(--color-panel-border, #e0e0e0);
          border-radius: var(--radius, 8px);
          box-shadow: var(--shadow-card, 0 2px 10px rgba(0, 0, 0, 0.1));
          font-family: var(--font-family-ui, system-ui, -apple-system, sans-serif);
          font-size: var(--font-size-small10, 13px);
          transition: box-shadow 0.2s ease;
          display: flex;
          flex-direction: column;
        }
        
        #ui-kit-theme-switcher.dragging {
          cursor: move;
          box-shadow: var(--shadow-cardHover, 0 8px 30px rgba(0, 0, 0, 0.2));
        }
        
        [data-theme-type="dark"] #ui-kit-theme-switcher {
          background: var(--color-panel-background, rgba(30, 30, 30, 0.95));
          border-color: var(--color-panel-border, #444);
          color: var(--color-panel-text, #fff);
        }
        
        .theme-switcher-gripper {
          height: 32px;
          background: var(--color-panel-backgroundSoft10, rgba(0, 0, 0, 0.03));
          border-bottom: 1px solid var(--color-panel-border, #e0e0e0);
          border-radius: var(--radius, 8px) var(--radius, 8px) 0 0;
          cursor: move;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--spacing-small10, 8px);
          user-select: none;
        }
        
        [data-theme-type="dark"] .theme-switcher-gripper {
          background: var(--color-panel-backgroundSoft10, rgba(255, 255, 255, 0.03));
          border-color: var(--color-panel-border, #444);
        }
        
        .theme-switcher-gripper:hover {
          background: var(--color-panel-backgroundSoft20, rgba(0, 0, 0, 0.06));
        }
        
        [data-theme-type="dark"] .theme-switcher-gripper:hover {
          background: var(--color-panel-backgroundSoft20, rgba(255, 255, 255, 0.06));
        }
        
        .gripper-lines {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          justify-content: center;
          padding: 0 var(--spacing-small10, 8px);
          margin-right: var(--spacing-small10, 8px);
        }
        
        .gripper-line {
          height: 1px;
          background: var(--color-panel-border, #e0e0e0);
          border-radius: 0.5px;
          width: 100%;
        }
        
        .theme-switcher-content {
          flex: 1;
          padding: var(--spacing, 12px);
        }
        
        .minimize-btn {
          padding: 4px;
          background: transparent;
          border: none;
          border-radius: var(--radius-small10, 4px);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-body-textSoft10, #666);
          transition: all 0.2s;
        }
        
        .minimize-btn:hover {
          background: var(--color-panel-backgroundHover, rgba(0, 0, 0, 0.05));
          color: var(--color-body-text, #333);
        }
        
        [data-theme-type="dark"] .minimize-btn:hover {
          background: var(--color-panel-backgroundHover, rgba(255, 255, 255, 0.05));
          color: var(--color-body-text, #fff);
        }
        
        .theme-switcher-grid {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: var(--spacing-small10, 8px);
          align-items: center;
        }
        
        #ui-kit-theme-switcher select {
          padding: var(--spacing-small20, 4px) var(--spacing-small10, 6px);
          border: 1px solid var(--color-input-border, #ddd);
          border-radius: var(--radius-small10, 4px);
          background: var(--color-input-background, white);
          color: var(--color-input-text, #333);
          font-size: inherit;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }
        
        [data-theme-type="dark"] #ui-kit-theme-switcher select {
          background: var(--color-input-background, #444);
          border-color: var(--color-input-border, #555);
          color: var(--color-input-text, #fff);
        }
        
        #ui-kit-theme-switcher select:hover {
          background: var(--color-input-backgroundHover, #f5f5f5);
          border-color: var(--color-input-borderHover, #999);
        }
        
        [data-theme-type="dark"] #ui-kit-theme-switcher select:hover {
          background: var(--color-input-backgroundHover, #555);
          border-color: var(--color-input-borderHover, #777);
        }
        
        #ui-kit-theme-switcher label {
          font-weight: var(--font-weight-medium, 500);
          color: var(--color-panel-text, inherit);
          white-space: nowrap;
          font-size: var(--font-size-small20, 12px);
          text-align: right;
          padding-right: var(--spacing-small20, 4px);
        }
      </style>
      
      <div class="theme-switcher-gripper">
        <div class="gripper-lines">
          <div class="gripper-line"></div>
          <div class="gripper-line"></div>
          <div class="gripper-line"></div>
        </div>
        <button class="minimize-btn" title="Minimize (click lightbulb to restore)">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
          </svg>
        </button>
      </div>
      
      <div class="theme-switcher-content">
        <div class="theme-switcher-grid">
          <label for="theme-selector">Theme:</label>
          <select id="theme-selector">
            ${h.map(
              (e) => `<option value="${e}">${d(e)}</option>`
            ).join("")}
          </select>
          
          <label for="mode-selector">Mode:</label>
          <select id="mode-selector">
            <option value="auto">System theme</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>
    `;
    
    // Setup drag functionality
    const gripper = a.querySelector('.theme-switcher-gripper');
    const minimizeBtn = a.querySelector('.minimize-btn');
    
    gripper.addEventListener('mousedown', startDrag);
    
    function startDrag(e) {
      isDragging = true;
      a.classList.add('dragging');
      
      const rect = a.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left - rect.width / 2;
      dragOffset.y = e.clientY - rect.top - rect.height / 2;
      
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', stopDrag);
      e.preventDefault();
    }
    
    function drag(e) {
      if (!isDragging) return;
      
      const x = ((e.clientX - dragOffset.x) / window.innerWidth) * 100;
      const y = ((e.clientY - dragOffset.y) / window.innerHeight) * 100;
      
      // Keep element on screen - account for 280px width and estimated height
      // Since we use translate(-50%, -50%), we need half the element size as margin
      const elementSizePercent = {
        x: (140 / window.innerWidth) * 100,  // Half of 280px width
        y: (50 / window.innerHeight) * 100   // Approximate half height
      };
      
      position.x = Math.max(elementSizePercent.x, Math.min(100 - elementSizePercent.x, x));
      position.y = Math.max(elementSizePercent.y, Math.min(100 - elementSizePercent.y, y));
      
      updatePosition();
    }
    
    function stopDrag() {
      isDragging = false;
      a.classList.remove('dragging');
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', stopDrag);
      const saved = loadSavedState();
      saveState({ 
        ...saved, 
        minimized: false, 
        expandedPosition: position 
      });
    }
    
    minimizeBtn.addEventListener('click', () => {
      isMinimized = true;
      const saved = loadSavedState();
      // Save current expanded position before switching
      const currentExpandedPosition = position;
      const minimizedPosition = saved.minimizedPosition || { x: 50, y: 95 };
      
      // Fade out and scale down the window
      a.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      a.style.opacity = '0';
      a.style.transform = 'translate(-50%, -50%) scale(0.9)';
      
      // After fade out, switch to minimized and fade in at saved position
      setTimeout(() => {
        position = minimizedPosition;
        updatePosition();
        saveState({ 
          ...saved, 
          minimized: true,
          minimizedPosition: minimizedPosition,
          expandedPosition: currentExpandedPosition // Remember where we were
        });
        
        renderMinimized();
        
        // Start with opacity 0 and slightly scaled down
        a.style.transition = 'none';
        a.style.opacity = '0';
        a.style.transform = 'translate(-50%, -50%) scale(0.8)';
        
        // Force reflow
        a.offsetHeight;
        
        // Fade in and scale to normal
        a.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        a.style.opacity = '1';
        a.style.transform = 'translate(-50%, -50%) scale(1)';
        
        // Clean up
        setTimeout(() => {
          a.style.transition = '';
          a.style.opacity = '';
          a.style.transform = 'translate(-50%, -50%)';
        }, 300);
      }, 200);
    });
    
    // Setup theme controls
    const c = s().getTheme();
    const o = a.querySelector("#theme-selector");
    const i = a.querySelector("#mode-selector");
    
    if (o) o.value = c.theme;
    if (i) i.value = c.mode;
    
    o?.addEventListener("change", async (e) => {
      const l = e.target;
      await s().setTheme({ theme: l.value });
    });
    
    i?.addEventListener("change", async (e) => {
      const l = e.target;
      await s().setTheme({ mode: l.value });
    });
    
    s().subscribe((e) => {
      if (o && o.value !== e.theme) o.value = e.theme;
      if (i && i.value !== e.mode) i.value = e.mode;
    });
  }
  
  document.body.appendChild(a);
  updatePosition();
  
  if (isMinimized) {
    renderMinimized();
  } else {
    renderExpanded();
  }
  
  return a;
}

async function u(t) {
  const { autoInit: n = !0, ...r } = t || {};
  if (!n) return;
  await (await new Promise((c) => {
    const o = () => {
      const i = window.__uiKitTheme || window.uiKitTheme;
      i ? c(i) : setTimeout(o, 10);
    };
    o();
  })).init(), document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => {
    m(r);
  }) : m(r);
}

function d(t) {
  return t.split("-").map(
    (n) => n.charAt(0).toUpperCase() + n.slice(1)
  ).join(" ");
}

typeof window < "u" && (window.createThemeSwitcher = m, window.initThemeSwitcher = u);
typeof window < "u" && document && (async () => await u())();
export {
  m as createThemeSwitcher,
  u as initThemeSwitcher
};