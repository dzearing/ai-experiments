import { useTheme } from '../contexts/ThemeContextV2';

export function BackgroundPattern() {
  const { isDarkMode } = useTheme();

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Static gradient with mesh */}
      <div
        className="absolute inset-0"
        style={{
          background: isDarkMode
            ? `
              radial-gradient(at 20% 30%, rgba(139, 92, 246, 0.3) 0px, transparent 50%),
              radial-gradient(at 80% 70%, rgba(34, 211, 238, 0.25) 0px, transparent 50%),
              radial-gradient(at 50% 50%, rgba(99, 102, 241, 0.2) 0px, transparent 50%),
              radial-gradient(at 30% 70%, rgba(236, 72, 153, 0.2) 0px, transparent 50%),
              radial-gradient(at 70% 30%, rgba(251, 191, 36, 0.15) 0px, transparent 50%),
              linear-gradient(to bottom right, #000000, #171717, #0a0a0a)
            `
            : `
              radial-gradient(at 20% 30%, rgba(168, 85, 247, 0.35) 0px, transparent 50%),
              radial-gradient(at 80% 70%, rgba(34, 211, 238, 0.3) 0px, transparent 50%),
              radial-gradient(at 50% 50%, rgba(99, 102, 241, 0.25) 0px, transparent 50%),
              radial-gradient(at 30% 70%, rgba(236, 72, 153, 0.25) 0px, transparent 50%),
              radial-gradient(at 70% 30%, rgba(251, 191, 36, 0.2) 0px, transparent 50%),
              linear-gradient(to bottom right, #d4d4d4, #e5e5e5, #d4d4d4)
            `,
        }}
      />

      {/* Grid pattern for texture */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.5'%3E%3Cpath d='M0 20h40M20 0v40'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}
