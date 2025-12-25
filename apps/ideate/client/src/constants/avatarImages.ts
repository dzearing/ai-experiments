/**
 * Professional avatar images for the facilitator bot.
 * Using inline SVGs with a clean, modern design.
 */

// Helper to create data URL from SVG
function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Robot avatar - friendly AI assistant
const robotSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect x="12" y="18" width="40" height="36" rx="4" fill="#5B6EE1"/>
  <rect x="18" y="26" width="10" height="10" rx="2" fill="#fff"/>
  <rect x="36" y="26" width="10" height="10" rx="2" fill="#fff"/>
  <circle cx="23" cy="31" r="3" fill="#1a1a2e"/>
  <circle cx="41" cy="31" r="3" fill="#1a1a2e"/>
  <rect x="24" y="42" width="16" height="4" rx="2" fill="#fff"/>
  <rect x="28" y="8" width="8" height="12" rx="2" fill="#5B6EE1"/>
  <circle cx="32" cy="6" r="4" fill="#8B9FFF"/>
  <rect x="6" y="28" width="6" height="16" rx="2" fill="#5B6EE1"/>
  <rect x="52" y="28" width="6" height="16" rx="2" fill="#5B6EE1"/>
</svg>`;

// Owl avatar - wise and observant
const owlSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <ellipse cx="32" cy="38" rx="22" ry="20" fill="#8B5A2B"/>
  <ellipse cx="32" cy="36" rx="18" ry="16" fill="#D2691E"/>
  <circle cx="22" cy="32" r="10" fill="#fff"/>
  <circle cx="42" cy="32" r="10" fill="#fff"/>
  <circle cx="22" cy="32" r="5" fill="#1a1a2e"/>
  <circle cx="42" cy="32" r="5" fill="#1a1a2e"/>
  <path d="M32 40 L28 48 L32 46 L36 48 Z" fill="#FFB347"/>
  <path d="M14 20 Q22 28 26 24" stroke="#8B5A2B" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M50 20 Q42 28 38 24" stroke="#8B5A2B" stroke-width="3" fill="none" stroke-linecap="round"/>
</svg>`;

// Lightbulb avatar - creative and inspiring
const lightbulbSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <circle cx="32" cy="28" r="18" fill="#FFD93D"/>
  <circle cx="32" cy="28" r="14" fill="#FFF176"/>
  <rect x="26" y="44" width="12" height="8" fill="#E0E0E0"/>
  <rect x="24" y="52" width="16" height="4" rx="2" fill="#9E9E9E"/>
  <rect x="26" y="56" width="12" height="2" rx="1" fill="#757575"/>
  <path d="M28 44 L28 38 Q28 34 32 34 Q36 34 36 38 L36 44" fill="#BDBDBD"/>
  <line x1="32" y1="10" x2="32" y2="4" stroke="#FFD93D" stroke-width="2" stroke-linecap="round"/>
  <line x1="48" y1="14" x2="52" y2="10" stroke="#FFD93D" stroke-width="2" stroke-linecap="round"/>
  <line x1="16" y1="14" x2="12" y2="10" stroke="#FFD93D" stroke-width="2" stroke-linecap="round"/>
  <line x1="54" y1="28" x2="60" y2="28" stroke="#FFD93D" stroke-width="2" stroke-linecap="round"/>
  <line x1="4" y1="28" x2="10" y2="28" stroke="#FFD93D" stroke-width="2" stroke-linecap="round"/>
</svg>`;

// Brain avatar - intelligent and analytical
const brainSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <ellipse cx="32" cy="34" rx="24" ry="22" fill="#FF8FAB"/>
  <path d="M32 14 Q24 14 20 22 Q16 30 20 38 Q16 42 20 48" stroke="#FF6B8A" stroke-width="3" fill="none"/>
  <path d="M32 14 Q40 14 44 22 Q48 30 44 38 Q48 42 44 48" stroke="#FF6B8A" stroke-width="3" fill="none"/>
  <path d="M24 26 Q32 22 40 26" stroke="#FF6B8A" stroke-width="2" fill="none"/>
  <path d="M22 36 Q32 32 42 36" stroke="#FF6B8A" stroke-width="2" fill="none"/>
  <path d="M24 46 Q32 42 40 46" stroke="#FF6B8A" stroke-width="2" fill="none"/>
  <circle cx="32" cy="14" r="4" fill="#FF8FAB"/>
</svg>`;

// Compass avatar - guiding and navigating
const compassSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <circle cx="32" cy="32" r="26" fill="#2C3E50"/>
  <circle cx="32" cy="32" r="22" fill="#34495E"/>
  <circle cx="32" cy="32" r="18" fill="#ECF0F1"/>
  <polygon points="32,14 36,32 32,36 28,32" fill="#E74C3C"/>
  <polygon points="32,50 28,32 32,28 36,32" fill="#BDC3C7"/>
  <circle cx="32" cy="32" r="4" fill="#2C3E50"/>
  <circle cx="32" cy="32" r="2" fill="#E74C3C"/>
  <text x="32" y="10" text-anchor="middle" font-size="6" fill="#2C3E50" font-weight="bold">N</text>
  <text x="32" y="58" text-anchor="middle" font-size="6" fill="#2C3E50" font-weight="bold">S</text>
  <text x="8" y="34" text-anchor="middle" font-size="6" fill="#2C3E50" font-weight="bold">W</text>
  <text x="56" y="34" text-anchor="middle" font-size="6" fill="#2C3E50" font-weight="bold">E</text>
</svg>`;

// Star avatar - bright and helpful
const starSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <polygon points="32,4 38,24 60,24 42,38 50,58 32,46 14,58 22,38 4,24 26,24" fill="#FFD700"/>
  <polygon points="32,10 36,24 50,24 40,34 44,48 32,40 20,48 24,34 14,24 28,24" fill="#FFEB3B"/>
  <circle cx="32" cy="30" r="8" fill="#FFF9C4"/>
</svg>`;

// Spark avatar - energetic and quick
const sparkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <polygon points="32,2 38,22 58,22 42,36 48,56 32,44 16,56 22,36 6,22 26,22" fill="#7C4DFF"/>
  <polygon points="32,8 36,22 50,22 40,32 44,46 32,38 20,46 24,32 14,22 28,22" fill="#B388FF"/>
  <circle cx="32" cy="28" r="6" fill="#E8DAFF"/>
  <line x1="10" y1="10" x2="16" y2="16" stroke="#7C4DFF" stroke-width="2" stroke-linecap="round"/>
  <line x1="54" y1="10" x2="48" y2="16" stroke="#7C4DFF" stroke-width="2" stroke-linecap="round"/>
  <line x1="32" y1="58" x2="32" y2="62" stroke="#7C4DFF" stroke-width="2" stroke-linecap="round"/>
</svg>`;

// Crystal avatar - clear and precise
const crystalSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <polygon points="32,4 50,20 50,44 32,60 14,44 14,20" fill="#00BCD4"/>
  <polygon points="32,4 50,20 32,32 14,20" fill="#4DD0E1"/>
  <polygon points="32,60 50,44 32,32 14,44" fill="#0097A7"/>
  <polygon points="32,4 32,60" stroke="#00838F" stroke-width="1"/>
  <polygon points="14,20 50,44" stroke="#00838F" stroke-width="1"/>
  <polygon points="50,20 14,44" stroke="#00838F" stroke-width="1"/>
  <circle cx="32" cy="32" r="4" fill="#E0F7FA"/>
</svg>`;

/**
 * Map of avatar IDs to their image data URLs
 */
export const AVATAR_IMAGES: Record<string, string> = {
  robot: svgToDataUrl(robotSvg),
  owl: svgToDataUrl(owlSvg),
  lightbulb: svgToDataUrl(lightbulbSvg),
  brain: svgToDataUrl(brainSvg),
  compass: svgToDataUrl(compassSvg),
  star: svgToDataUrl(starSvg),
  spark: svgToDataUrl(sparkSvg),
  crystal: svgToDataUrl(crystalSvg),
};

/**
 * Avatar options for the settings UI
 */
export const AVATAR_OPTIONS = [
  { id: 'robot', label: 'Robot', description: 'Friendly AI assistant' },
  { id: 'owl', label: 'Owl', description: 'Wise and observant' },
  { id: 'lightbulb', label: 'Lightbulb', description: 'Creative and inspiring' },
  { id: 'brain', label: 'Brain', description: 'Intelligent and analytical' },
  { id: 'compass', label: 'Compass', description: 'Guiding and navigating' },
  { id: 'star', label: 'Star', description: 'Bright and helpful' },
  { id: 'spark', label: 'Spark', description: 'Energetic and quick' },
  { id: 'crystal', label: 'Crystal', description: 'Clear and precise' },
];

/**
 * Get the image URL for an avatar ID, with fallback
 */
export function getAvatarImage(avatarId: string): string {
  return AVATAR_IMAGES[avatarId] || AVATAR_IMAGES.robot;
}
