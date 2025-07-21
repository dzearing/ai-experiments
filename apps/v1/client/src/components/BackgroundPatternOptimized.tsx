import { useTheme } from '../contexts/ThemeContextV2';

export function BackgroundPattern() {
  const { isDarkMode } = useTheme();

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Static gradient base - no performance cost */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-500 via-neutral-300 to-neutral-400 dark:from-black dark:via-neutral-900 dark:to-neutral-950" />

      {/* Animated gradient circles - blues with orange/pink accents */}
      <div className="absolute inset-0">
        {/* Blue circle - top left */}
        <div
          className={`absolute -top-96 -left-96 w-[100rem] h-[100rem] ${
            isDarkMode
              ? 'bg-gradient-radial from-blue-600/30 to-transparent'
              : 'bg-gradient-radial from-blue-500/40 to-transparent'
          } rounded-full animate-float-slow`}
          style={{
            willChange: 'transform',
            transform: 'translate3d(0, 0, 0)',
          }}
        />

        {/* Vibrant orange circle - bottom right */}
        <div
          className={`absolute -bottom-96 -right-96 w-[110rem] h-[110rem] ${
            isDarkMode
              ? 'bg-gradient-radial from-orange-500/25 to-transparent'
              : 'bg-gradient-radial from-orange-400/35 to-transparent'
          } rounded-full animate-float-reverse`}
          style={{
            willChange: 'transform',
            transform: 'translate3d(0, 0, 0)',
            animationDelay: '10s',
          }}
        />

        {/* Sky blue circle - center */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90rem] h-[90rem] ${
            isDarkMode
              ? 'bg-gradient-radial from-sky-600/20 to-transparent'
              : 'bg-gradient-radial from-sky-500/30 to-transparent'
          } rounded-full animate-float-slow`}
          style={{
            willChange: 'transform',
            animationDelay: '5s',
          }}
        />

        {/* Vibrant pink circle - top right */}
        <div
          className={`absolute -top-64 -right-64 w-[80rem] h-[80rem] ${
            isDarkMode
              ? 'bg-gradient-radial from-pink-500/25 to-transparent'
              : 'bg-gradient-radial from-pink-400/35 to-transparent'
          } rounded-full animate-float-reverse`}
          style={{
            willChange: 'transform',
            animationDelay: '15s',
          }}
        />

        {/* Deep blue circle - bottom left */}
        <div
          className={`absolute -bottom-80 -left-80 w-[95rem] h-[95rem] ${
            isDarkMode
              ? 'bg-gradient-radial from-indigo-600/20 to-transparent'
              : 'bg-gradient-radial from-indigo-500/30 to-transparent'
          } rounded-full animate-float-slow`}
          style={{
            willChange: 'transform',
            animationDelay: '20s',
          }}
        />
      </div>

      {/* Very subtle noise texture */}
      <div
        className="absolute inset-0 opacity-[0.01]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
