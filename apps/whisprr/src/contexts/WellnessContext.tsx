import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { WellnessBreakModal } from '../components/common/WellnessBreakModal';

interface WellnessContextType {
  isQuietHoursActive: boolean;
  activeMinutes: number;
  resetActiveMinutes: () => void;
}

const WellnessContext = createContext<WellnessContextType | undefined>(undefined);

export function WellnessProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  
  const [isQuietHoursActive, setIsQuietHoursActive] = useState(false);
  const [activeMinutes, setActiveMinutes] = useState(0);
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
  const [currentBreakMessage, setCurrentBreakMessage] = useState('');
  
  const lastActivityRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const quietHoursRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Wellness reminders positive microcopy list
  const WELLNESS_MESSAGES = [
    "You've been creating for a while! Remember to stretch and hydrate. 💧",
    "Great work! Maybe take a quick breath and rest your eyes? 🌬️",
    "Creativity flows best with a rested mind. Consider a short break! 💫",
    "Time flies when you are in the zone. Take a moment to stand up and walk around. 🚶‍♂️",
    "Your creative voice is precious. Take a brief pause to refresh. ✨"
  ];

  // Check if quiet hours are currently active based on local time
  const checkQuietHours = useCallback(() => {
    if (!profile || !(profile as any).wellness_quiet_hours_enabled) {
      setIsQuietHoursActive(false);
      return;
    }

    const start = (profile as any).wellness_quiet_hours_start || '22:00';
    const end = (profile as any).wellness_quiet_hours_end || '08:00';

    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

    let active = false;
    if (start < end) {
      active = currentStr >= start && currentStr <= end;
    } else {
      active = currentStr >= start || currentStr <= end;
    }
    
    setIsQuietHoursActive(active);
  }, [profile]);

  // Handle user activity listeners to track if they are active
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, []);

  // Track active minutes (once per minute if active within last 5 minutes)
  useEffect(() => {
    if (!profile) {
      setActiveMinutes(0);
      return;
    }

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      
      // If user was active within last 5 minutes
      if (timeSinceLastActivity < 5 * 60 * 1000) {
        setActiveMinutes(prev => {
          const next = prev + 1;
          const frequency = (profile as any).wellness_break_frequency_minutes || 60;
          const isRemindersEnabled = (profile as any).wellness_break_reminders_enabled || false;
          
          if (isRemindersEnabled && next >= frequency) {
            // Trigger a random positive wellness reminder modal
            const randomIndex = Math.floor(Math.random() * WELLNESS_MESSAGES.length);
            setCurrentBreakMessage(WELLNESS_MESSAGES[randomIndex]);
            setIsBreakModalOpen(true);
            return 0; // Reset active minutes
          }
          return next;
        });
      }
    }, 60 * 1000); // Check every minute

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [profile]);

  // Schedule quiet hours check every minute
  useEffect(() => {
    checkQuietHours();
    if (quietHoursRef.current) clearInterval(quietHoursRef.current);
    quietHoursRef.current = setInterval(checkQuietHours, 60 * 1000);
    return () => {
      if (quietHoursRef.current) clearInterval(quietHoursRef.current);
    };
  }, [checkQuietHours]);

  const resetActiveMinutes = useCallback(() => {
    setActiveMinutes(0);
  }, []);

  return (
    <WellnessContext.Provider value={{ isQuietHoursActive, activeMinutes, resetActiveMinutes }}>
      {children}
      <WellnessBreakModal 
        isOpen={isBreakModalOpen}
        message={currentBreakMessage}
        onDismiss={() => setIsBreakModalOpen(false)}
        onTakeBreak={() => {
          setIsBreakModalOpen(false);
          // Optional: we could navigate them to a breathing exercise page or just close
        }}
      />
    </WellnessContext.Provider>
  );
}

export function useWellness() {
  const context = useContext(WellnessContext);
  if (context === undefined) {
    throw new Error('useWellness must be used within a WellnessProvider');
  }
  return context;
}
