import { memo } from 'react';

interface DancingBubblesProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
}

export const DancingBubbles = memo(function DancingBubbles({
  size = 'small',
  color = 'bg-neutral-400',
  className = '',
}: DancingBubblesProps) {
  const sizeClasses = {
    small: 'w-2 h-2',
    medium: 'w-2.5 h-2.5',
    large: 'w-3 h-3',
  };

  const bubbleClass = `${sizeClasses[size]} ${color} rounded-full animate-bounce`;

  return (
    <div className={`flex gap-1 ${className}`}>
      <div className={bubbleClass} style={{ animationDelay: '0ms' }}></div>
      <div className={bubbleClass} style={{ animationDelay: '150ms' }}></div>
      <div className={bubbleClass} style={{ animationDelay: '300ms' }}></div>
    </div>
  );
});
