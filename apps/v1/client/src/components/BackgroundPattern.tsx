import { useTheme } from '../contexts/ThemeContextV2';

export function BackgroundPattern() {
  const { isDarkMode } = useTheme();

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      style={{ isolation: 'isolate' }}
    >
      {/* Gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-500 via-neutral-300 to-neutral-400 dark:from-black dark:via-neutral-900 dark:to-neutral-950" />

      {/* Animated gradient orbs - more, bigger, more transparent */}
      <div className="absolute inset-0">
        <div
          className={`absolute -top-40 -left-40 w-[40rem] h-[40rem] ${
            isDarkMode ? 'bg-purple-600' : 'bg-purple-400'
          } rounded-full mix-blend-multiply dark:mix-blend-lighter filter blur-3xl opacity-40 animate-blob-slow`}
        />
        <div
          className={`absolute -top-20 -right-20 w-[30rem] h-[30rem] ${
            isDarkMode ? 'bg-yellow-800' : 'bg-yellow-400'
          } rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob-reverse animation-delay-5000`}
        />
        <div
          className={`absolute -bottom-40 left-40 w-[35rem] h-[35rem] ${
            isDarkMode ? 'bg-pink-800' : 'bg-pink-400'
          } rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob-slow animation-delay-2000`}
        />
        <div
          className={`absolute bottom-20 right-40 w-[32rem] h-[32rem] ${
            isDarkMode ? 'bg-cyan-800' : 'bg-cyan-400'
          } rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob-reverse animation-delay-7000`}
        />
        <div
          className={`absolute top-1/3 left-1/4 w-[38rem] h-[38rem] ${
            isDarkMode ? 'bg-indigo-800' : 'bg-indigo-400'
          } rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob-slow animation-delay-4000`}
        />
        <div
          className={`absolute top-3/4 right-1/3 w-[28rem] h-[28rem] ${
            isDarkMode ? 'bg-emerald-800' : 'bg-emerald-400'
          } rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob-reverse animation-delay-3000`}
        />
        <div
          className={`absolute top-1/2 right-1/4 w-[36rem] h-[36rem] ${
            isDarkMode ? 'bg-rose-800' : 'bg-rose-400'
          } rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob-slow animation-delay-6000`}
        />
        <div
          className={`absolute bottom-1/3 left-1/2 w-[34rem] h-[34rem] ${
            isDarkMode ? 'bg-amber-800' : 'bg-amber-400'
          } rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob-reverse animation-delay-8000`}
        />
        <div
          className={`absolute top-1/4 left-1/2 w-[42rem] h-[42rem] ${
            isDarkMode ? 'bg-violet-800' : 'bg-violet-400'
          } rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-25 animate-blob-slow animation-delay-1000`}
        />
        <div
          className={`absolute bottom-1/4 right-1/5 w-[30rem] h-[30rem] ${
            isDarkMode ? 'bg-teal-800' : 'bg-teal-400'
          } rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob-reverse animation-delay-9000`}
        />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
