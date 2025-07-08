import { memo, type ReactNode } from 'react';
import { useTheme } from '../../contexts/ThemeContextV2';

export interface ChatBubbleProps {
  children: ReactNode;
  variant?: 'sent' | 'received';
  showAvatar?: boolean;
  avatar?: ReactNode;
  name?: string;
  timestamp?: Date;
  status?: 'sending' | 'sent' | 'error';
  className?: string;
}

export const ChatBubble = memo(function ChatBubble({
  children,
  variant = 'received',
  showAvatar = false,
  avatar,
  name,
  timestamp,
  status,
  className = ''
}: ChatBubbleProps) {
  const { currentStyles } = useTheme();
  const styles = currentStyles;
  
  const isSent = variant === 'sent';
  
  return (
    <div className={`flex gap-3 ${isSent ? 'justify-end' : ''} ${className}`} data-testid="message-bubble">
      {!isSent && showAvatar && (
        <div className="flex-shrink-0">
          {avatar}
        </div>
      )}
      
      <div className={`max-w-[70%] ${isSent ? 'order-first' : ''}`}>
        {!isSent && name && (
          <div className={`text-xs ${styles.mutedText} mb-1`}>{name}</div>
        )}
        
        <div className={`px-4 py-2 ${styles.buttonRadius} ${
          isSent 
            ? `${styles.primaryButton} ${styles.primaryButtonText}`
            : `${styles.cardBg} ${styles.cardBorder} border ${styles.textColor}`
        }`}>
          {children}
        </div>
        
        {(timestamp || status) && (
          <div className={`text-xs ${styles.mutedText} mt-1 ${isSent ? 'text-right' : ''} flex items-center gap-2 ${isSent ? 'justify-end' : ''}`}>
            {timestamp && timestamp.toLocaleTimeString()}
            {status === 'sending' && <span>Sending...</span>}
            {status === 'error' && <span className="text-red-500">Failed to send</span>}
          </div>
        )}
      </div>
      
      {isSent && showAvatar && (
        <div className="flex-shrink-0">
          {avatar}
        </div>
      )}
    </div>
  );
});