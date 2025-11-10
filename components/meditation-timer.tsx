'use client';

import { SlidingNumber } from '@/components/core/sliding-number';
import { useEffect, useState, useCallback, useRef } from 'react';
import NoSleep from 'nosleep.js';
import { Volume2, VolumeX } from 'lucide-react';

/**
 * Timer mode type
 */
type TimerMode = 'clock' | 'timer' | 'mode3';

/**
 * Timer preset configuration
 * @interface TimerPreset
 */
interface TimerPreset {
  label: string;
  seconds: number;
}

const PRESETS: TimerPreset[] = [
  { label: '5 sec',  seconds: 5 },
  { label: '10 min', seconds: 10*60 },
  { label: '15 min', seconds: 15*60 },
  { label: '30 min', seconds: 30*60 },
];

const MODES: { value: TimerMode; label: string }[] = [
  { value: 'clock', label: 'Clock' },
  { value: 'timer', label: 'Timer' },
];

/**
 * Meditation timer component with preset durations and countdown functionality
 * Features animated number display using SlidingNumber component
 *
 * @returns {JSX.Element} Meditation timer interface
 */
export function MeditationTimer() {
  const [mode, setMode] = useState<TimerMode>('clock');
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [totalSeconds, setTotalSeconds] = useState<number>(
    PRESETS[0].seconds
  );
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    PRESETS[0].seconds
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [flashCount, setFlashCount] = useState<number>(0);
  const [flashIntensity, setFlashIntensity] = useState<number>(0);
  const [targetTimestamp, setTargetTimestamp] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const noSleepRef = useRef<NoSleep | null>(null);
  const [noSleepEnabled, setNoSleepEnabled] = useState<boolean>(false);

  // Sound notification state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clock mode state
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    // Initialize audio on mount
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/bowl.mp3');
      audioRef.current.preload = 'auto';
    }
  }, []);

  // Display values based on mode
  // Use 0 for initial server render to prevent hydration mismatch
  const displayHours = mode === 'clock' ? (isMounted ? currentTime.getHours() : 0) : null;
  const displayMinutes = mode === 'clock'
    ? (isMounted ? currentTime.getMinutes() : 0)
    : Math.floor(remainingSeconds / 60);
  const displaySeconds = mode === 'clock'
    ? (isMounted ? currentTime.getSeconds() : 0)
    : remainingSeconds % 60;

  /**
   * Toggle sound notification
   */
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  /**
   * Play notification sound
   */
  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.warn('Failed to play notification sound:', err);
      });
    }
  }, [soundEnabled]);

  /**
   * Enable NoSleep on user interaction (only once)
   */
  const enableNoSleepOnClick = useCallback(() => {
    if (!noSleepEnabled) {
      try {
        // Create NoSleep instance only on first user click
        if (!noSleepRef.current) {
          noSleepRef.current = new NoSleep();
        }
        noSleepRef.current.enable();
        setNoSleepEnabled(true);
        console.log('NoSleep.js enabled - screen will stay awake');
      } catch (err) {
        console.warn('Failed to enable NoSleep.js:', err);
      }
    }
  }, [noSleepEnabled]);

  /**
   * Toggle fullscreen mode
   */
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.warn('Failed to enter fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, []);

  /**
   * Track fullscreen state changes
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  /**
   * Clock mode - update current time every second
   */
  useEffect(() => {
    if (mode !== 'clock') return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [mode]);

  /**
   * Load timer state from localStorage on mount
   */
  useEffect(() => {
    const savedState = localStorage.getItem('meditationTimer');
    if (savedState) {
      try {
        const { targetTimestamp, selectedPreset, totalSeconds } = JSON.parse(savedState);
        const now = Date.now();

        if (targetTimestamp && targetTimestamp > now) {
          // Timer is still running
          const remaining = Math.ceil((targetTimestamp - now) / 1000);
          setSelectedPreset(selectedPreset);
          setTotalSeconds(totalSeconds);
          setRemainingSeconds(remaining);
          setTargetTimestamp(targetTimestamp);
          setIsRunning(true);
        } else if (targetTimestamp && targetTimestamp <= now) {
          // Timer has completed
          setSelectedPreset(selectedPreset);
          setTotalSeconds(totalSeconds);
          setRemainingSeconds(0);
          setIsCompleted(true);
          localStorage.removeItem('meditationTimer');
        } else {
          // Timer was paused or not running
          setSelectedPreset(selectedPreset);
          setTotalSeconds(totalSeconds);
          setRemainingSeconds(totalSeconds);
        }
      } catch (e) {
        console.error('Failed to load timer state:', e);
      }
    }
  }, []);

  /**
   * Handle preset selection
   * Resets timer to selected preset duration
   */
  const handlePresetSelect = useCallback((index: number) => {
    const newSeconds = PRESETS[index].seconds;
    setSelectedPreset(index);
    setTotalSeconds(newSeconds);
    setRemainingSeconds(newSeconds);
    setIsRunning(false);
    setIsCompleted(false);
    setFlashCount(0);
    setFlashIntensity(0);
  }, []);

  /**
   * Start or pause the timer
   */
  const handleStartPause = useCallback(() => {
    if (isCompleted) {
      handleReset();
    } else {
      setIsRunning((prev) => {
        const newIsRunning = !prev;
        if (newIsRunning) {
          // Starting timer - calculate target timestamp
          const target = Date.now() + remainingSeconds * 1000;
          setTargetTimestamp(target);
          localStorage.setItem('meditationTimer', JSON.stringify({
            targetTimestamp: target,
            selectedPreset,
            totalSeconds
          }));
        } else {
          // Pausing timer - save current state without target
          setTargetTimestamp(null);
          localStorage.setItem('meditationTimer', JSON.stringify({
            targetTimestamp: null,
            selectedPreset,
            totalSeconds
          }));
        }
        return newIsRunning;
      });
    }
  }, [isCompleted, remainingSeconds, selectedPreset, totalSeconds]);

  /**
   * Reset timer to selected preset duration
   */
  const handleReset = useCallback(() => {
    setRemainingSeconds(totalSeconds);
    setIsRunning(false);
    setIsCompleted(false);
    setFlashCount(0);
    setFlashIntensity(0);
    setTargetTimestamp(null);
    localStorage.removeItem('meditationTimer');
  }, [totalSeconds]);

  /**
   * Timer countdown effect
   * Uses targetTimestamp for accurate countdown even after page reload
   */
  useEffect(() => {
    if (!isRunning || !targetTimestamp) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.ceil((targetTimestamp - now) / 1000);

      if (remaining <= 0) {
        setRemainingSeconds(0);
        setIsRunning(false);
        setIsCompleted(true);
        setTargetTimestamp(null);
        localStorage.removeItem('meditationTimer');
        playNotificationSound();
      } else {
        setRemainingSeconds(remaining);
      }
    }, 100); // Update every 100ms for smooth countdown

    return () => clearInterval(interval);
  }, [isRunning, targetTimestamp, playNotificationSound]);

  /**
   * Cleanup NoSleep on unmount
   */
  useEffect(() => {
    return () => {
      if (noSleepRef.current) {
        try {
          noSleepRef.current.disable();
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);


  /**
   * Wake Lock effect with NoSleep.js fallback
   * Prevents screen from turning off while timer is running or in clock mode
   * Re-acquires lock when page becomes visible again
   */
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    const shouldKeepAwake = mode === 'clock' || isRunning;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && 'request' in navigator.wakeLock) {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('Wake Lock API acquired');
        } else {
          throw new Error('Wake Lock API not supported');
        }
      } catch (err) {
        console.warn('Wake Lock API not available, using NoSleep.js:', err);
        // NoSleep.js will be enabled on first user interaction
      }
    };

    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible' && shouldKeepAwake) {
        requestWakeLock();
      }
    };

    if (shouldKeepAwake) {
      requestWakeLock();
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().then(() => {
          console.log('Wake Lock API released');
        });
      }
    };
  }, [mode, isRunning]);

  /**
   * Manage NoSleep state based on mode and timer
   * Keep it always enabled once activated to avoid play() errors
   */
  useEffect(() => {
    // Once enabled, keep NoSleep active at all times to prevent errors
    // The screen will stay awake continuously after first user interaction
  }, [mode, isRunning, noSleepEnabled]);

  /**
   * Flash effect when timer completes
   * Flashes red background 5 times using sine wave animation
   */
  useEffect(() => {
    if (!isCompleted || flashCount >= 10) return;

    let frameId: number;
    let startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000; // seconds
      const intensity = Math.pow(Math.sin(elapsed * Math.PI * 4) * 0.5 + 0.5, 4); // ~1Hz frequency

      setFlashIntensity(intensity);

      if (elapsed < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        setFlashCount((prev) => prev + 1);
        startTime = Date.now();
        if (flashCount < 4) {
          frameId = requestAnimationFrame(animate);
        } else {
          setFlashIntensity(0);
        }
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [isCompleted, flashCount]);

  return (
    <div
      className='relative flex min-h-screen flex-col items-center justify-center gap-8 bg-black p-4'
      onClick={enableNoSleepOnClick}
    >
      {/* Fullscreen flash overlay */}
      {mode === 'timer' && isCompleted && flashCount < 10 && (
        <div
          className='fixed inset-0 pointer-events-none z-50'
          style={{
            backgroundColor: `rgba(239, 68, 68, ${flashIntensity * 0.6})`,
          }}
        />
      )}

      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className='fixed top-4 right-4 z-10 text-zinc-600 hover:text-zinc-400 transition-colors'
        aria-label='Toggle fullscreen'
      >
        <svg
          width='24'
          height='24'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          {isFullscreen ? (
            <>
              <path d='M8 3v3a2 2 0 0 1-2 2H3'/>
              <path d='M21 8h-3a2 2 0 0 1-2-2V3'/>
              <path d='M3 16h3a2 2 0 0 1 2 2v3'/>
              <path d='M16 21v-3a2 2 0 0 1 2-2h3'/>
            </>
          ) : (
            <>
              <path d='M15 3h6v6'/>
              <path d='M9 21H3v-6'/>
              <path d='M21 3l-7 7'/>
              <path d='M3 21l7-7'/>
            </>
          )}
        </svg>
      </button>

      {/* Mode selector */}
      <div className='flex gap-6 relative z-10'>
        {MODES.map((modeOption) => (
          <button
            key={modeOption.value}
            onClick={() => setMode(modeOption.value)}
            className={`font-mono text-sm transition-opacity ${
              mode === modeOption.value
                ? 'text-white'
                : 'text-zinc-600 hover:text-zinc-400'
            } cursor-pointer`}
          >
            {modeOption.label}
          </button>
        ))}
      </div>

      {/* Preset buttons - only show for timer mode */}
      {mode === 'timer' && (
        <div className='flex gap-6 relative z-10'>
        {PRESETS.map((preset, index) => (
          <button
            key={preset.label}
            onClick={() => handlePresetSelect(index)}
            disabled={isRunning}
            className={`font-mono text-sm transition-opacity ${
              selectedPreset === index
                ? 'text-white'
                : 'text-zinc-600 hover:text-zinc-400'
            } ${
              isRunning ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'
            }`}
          >
            {preset.label}
          </button>
        ))}
        </div>
      )}

      {/* Timer display */}
      <div className={`flex flex-col items-center relative z-10 ${mode === 'clock' ? 'w-full' : ''}`}>
        <div
          className={`flex items-center justify-center gap-1 leading-none relative p-4 sm:p-8 ${
            mode === 'clock'
              ? 'text-7xl sm:text-8xl md:text-9xl lg:text-[12rem] xl:text-[16rem]'
              : 'text-8xl'
          }`}
          style={{ fontFamily: 'var(--font-manrope)', fontWeight: 200 }}
        >
          {/* Timer numbers */}
          <div className={`relative flex items-center gap-1 ${flashCount >= 10 ? 'text-zinc-600' : 'text-white'}`}>
            {mode === 'clock' && displayHours !== null && (
              <>
                <SlidingNumber value={displayHours} padStart={true} />
                <span className='text-zinc-600'>:</span>
              </>
            )}
            <SlidingNumber value={displayMinutes} padStart={true} />
            <span className='text-zinc-600'>:</span>
            <SlidingNumber value={displaySeconds} padStart={true} />
          </div>
        </div>

        {/* Progress bar - only show for timer mode */}
        {mode === 'timer' && (
          <div className='h-1 w-full overflow-hidden' style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
            <div
              className='h-full transition-all duration-1000 ease-linear'
              style={{
                width: `${((totalSeconds - remainingSeconds) / totalSeconds) * 100}%`,
                backgroundColor: (() => {
                  const progress = (totalSeconds - remainingSeconds) / totalSeconds;
                  if (progress < 0.5) {
                    return '#22c55e'; // Green
                  } else {
                    // Interpolate between green and orange
                    const t = (progress - 0.5) * 2; // 0 to 1
                    const r = Math.round(34 + (249 - 34) * t);
                    const g = Math.round(197 + (115 - 197) * t);
                    const b = Math.round(94 + (22 - 94) * t);
                    return `rgb(${r}, ${g}, ${b})`;
                  }
                })()
              }}
            />
          </div>
        )}
      </div>

      {/* Control buttons - only show for timer mode */}
      {mode === 'timer' && (
        <div className='flex gap-8 relative z-10'>
          <button
            onClick={handleStartPause}
            className='font-mono text-sm text-white transition-opacity hover:opacity-70'
          >
            {isCompleted ? 'restart' : isRunning ? 'pause' : 'start'}
          </button>
          <button
            onClick={handleReset}
            disabled={!isRunning && !isCompleted && remainingSeconds === totalSeconds}
            className='font-mono text-sm text-zinc-600 transition-opacity hover:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-30'
          >
            reset
          </button>
          <button
            onClick={toggleSound}
            className={`transition-colors ${
              soundEnabled
                ? 'text-white hover:opacity-70'
                : 'text-zinc-600 hover:text-zinc-400'
            }`}
            aria-label={soundEnabled ? 'Disable sound' : 'Enable sound'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      )}

    </div>
  );
}
