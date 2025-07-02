import { useMemo } from 'react';

interface AvatarProps {
  seed: string;
  size?: number;
  isDarkMode?: boolean;
}

const randomNames = [
  'Alex', 'Blake', 'Casey', 'Drew', 'Emery', 'Finley', 'Gray', 'Harper',
  'Indigo', 'Jamie', 'Kai', 'Logan', 'Morgan', 'Nova', 'Oakley', 'Phoenix',
  'Quinn', 'River', 'Sage', 'Taylor', 'Unity', 'Vale', 'Winter', 'Zion'
];

// Simple hash function to get consistent random values from seed
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getRandomFromSeed<T>(seed: string, array: T[]): T {
  const index = hashCode(seed) % array.length;
  return array[index];
}

function getRandomNumberFromSeed(seed: string, min: number, max: number): number {
  const hash = hashCode(seed);
  return min + (hash % (max - min + 1));
}

export function getRandomName(seed: string): string {
  return getRandomFromSeed(seed, randomNames);
}

export function AvatarGenerator({ seed, size = 100, isDarkMode = false }: AvatarProps) {
  const avatarData = useMemo(() => {
    // Skin colors (warm tones)
    const skinColors = ['#FFE0BD', '#FFCD94', '#F3C9A3', '#DDB192', '#D4A574', '#C58C5F'];
    const skinColor = getRandomFromSeed(seed + 'skin', skinColors);
    
    // Hair colors
    const hairColors = ['#2C1810', '#3D2314', '#5A3825', '#8B5A3C', '#D2691E', '#FFD700', '#FF6B6B', '#A8E6CF', '#9370DB'];
    const hairColor = getRandomFromSeed(seed + 'hair', hairColors);
    
    // Hair styles (0-5 different styles)
    const hairStyle = getRandomNumberFromSeed(seed + 'hairstyle', 0, 5);
    
    // Eye style (0 = dots, 1 = curved lines)
    const eyeStyle = getRandomNumberFromSeed(seed + 'eyestyle', 0, 1);
    
    // Accessories
    const hasGlasses = getRandomNumberFromSeed(seed + 'glasses', 0, 3) === 0;
    
    return { skinColor, hairColor, hairStyle, eyeStyle, hasGlasses };
  }, [seed]);
  
  const { skinColor, hairColor, hairStyle, eyeStyle, hasGlasses } = avatarData;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="rounded-full"
      style={{ backgroundColor: isDarkMode ? '#404040' : '#F0F4F8' }}
    >
      {/* Face - more oval shape */}
      <ellipse
        cx="50"
        cy="52"
        rx="28"
        ry="36"
        fill={skinColor}
      />
      
      {/* Hair */}
      {hairStyle === 0 && (
        // Short neat hair
        <path
          d={`M 25 30 Q 50 20, 75 30 Q 77 40, 75 45 L 25 45 Q 23 40, 25 30`}
          fill={hairColor}
        />
      )}
      {hairStyle === 1 && (
        // Bob cut
        <path
          d={`M 20 35 Q 50 15, 80 35 Q 82 55, 78 65 Q 75 62, 72 65 Q 65 60, 60 65 Q 50 58, 40 65 Q 35 60, 28 65 Q 25 62, 22 65 Q 18 55, 20 35`}
          fill={hairColor}
        />
      )}
      {hairStyle === 2 && (
        // Long straight hair
        <>
          <path
            d={`M 22 35 Q 50 18, 78 35 L 78 75 Q 75 80, 70 78 L 65 80 L 60 78 L 50 80 L 40 78 L 35 80 L 30 78 Q 25 80, 22 75 Z`}
            fill={hairColor}
          />
        </>
      )}
      {hairStyle === 3 && (
        // Side swept bangs
        <path
          d={`M 25 30 Q 50 20, 75 30 Q 77 40, 75 45 L 60 45 Q 65 35, 55 28 Q 45 30, 35 40 L 25 45 Q 23 40, 25 30`}
          fill={hairColor}
        />
      )}
      {hairStyle === 4 && (
        // Pigtails
        <>
          <path d={`M 25 30 Q 50 20, 75 30 Q 77 40, 75 45 L 25 45 Q 23 40, 25 30`} fill={hairColor} />
          <circle cx="18" cy="40" r="8" fill={hairColor} />
          <circle cx="82" cy="40" r="8" fill={hairColor} />
          <circle cx="15" cy="48" r="6" fill={hairColor} />
          <circle cx="85" cy="48" r="6" fill={hairColor} />
        </>
      )}
      {hairStyle === 5 && (
        // Messy/wavy hair
        <path
          d={`M 20 32 Q 30 15, 45 25 Q 50 15, 55 25 Q 70 15, 80 32 Q 82 42, 78 48 Q 75 45, 72 48 Q 68 44, 65 48 Q 60 43, 55 48 Q 50 42, 45 48 Q 40 43, 35 48 Q 32 44, 28 48 Q 25 45, 22 48 Q 18 42, 20 32`}
          fill={hairColor}
        />
      )}
      
      {/* Eyes - cute dots or curved lines */}
      {eyeStyle === 0 ? (
        // Dot eyes
        <>
          <circle cx="38" cy="48" r="2" fill="#2C1810" />
          <circle cx="62" cy="48" r="2" fill="#2C1810" />
        </>
      ) : (
        // Happy curved line eyes
        <>
          <path d="M 33 48 Q 38 52, 43 48" stroke="#2C1810" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 57 48 Q 62 52, 67 48" stroke="#2C1810" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}
      
      {/* Simple nose */}
      <circle cx="50" cy="56" r="1" fill={skinColor} opacity="0.4" />
      
      {/* Cute smile */}
      <path d="M 42 62 Q 50 66, 58 62" stroke="#E57373" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      
      {/* Cheeks (blush) */}
      <ellipse cx="28" cy="58" rx="6" ry="4" fill="#FFB6C1" opacity="0.25" />
      <ellipse cx="72" cy="58" rx="6" ry="4" fill="#FFB6C1" opacity="0.25" />
      
      {/* Glasses - rounder and cuter */}
      {hasGlasses && (
        <g fill="none" stroke="#333" strokeWidth="1.5">
          <circle cx="38" cy="48" r="10" />
          <circle cx="62" cy="48" r="10" />
          <line x1="48" y1="48" x2="52" y2="48" />
          <line x1="28" y1="46" x2="22" y2="44" strokeLinecap="round" />
          <line x1="72" y1="46" x2="78" y2="44" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}