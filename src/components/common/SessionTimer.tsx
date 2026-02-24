import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessibility } from '@/hooks/useAccessibility';

export default function SessionTimer() {
  const { user, timeLeft } = useAuth();
  const { screenReader, speak } = useAccessibility();
  
  useEffect(() => {
    if (!user || !screenReader) return;

    // Voice warning at 1 minute and 30 seconds
    if (timeLeft === 60) {
      speak('Warning: Your session will expire in 1 minute.');
    } else if (timeLeft === 30) {
      speak('Warning: Your session will expire in 30 seconds.');
    }
  }, [timeLeft, screenReader, speak, user]);

  if (!user) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white/50 backdrop-blur-sm"
      style={{ 
        borderColor: timeLeft < 60 ? '#ef4444' : 'rgba(14,13,11,.09)',
        color: timeLeft < 60 ? '#dc2626' : '#7a7368'
      }}
      title="Session Timeout"
      aria-label={`Session expires in ${minutes} minutes and ${seconds} seconds`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      <span className="text-[0.75rem] font-bold tabular-nums">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
