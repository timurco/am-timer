'use client';

import { SlidingNumber } from '@/components/core/sliding-number';
import { useEffect, useState, useCallback } from 'react';

/**
 * Timer preset configuration
 * @interface TimerPreset
 */
interface TimerPreset {
  label: string;
  minutes: number;
}

const PRESETS: TimerPreset[] = [
  { label: '2 min', minutes: 2 },
  { label: '10 min', minutes: 10 },
  { label: '30 min', minutes: 30 },
];

/**
 * Meditation timer component with preset durations and countdown functionality
 * Features animated number display using SlidingNumber component
 *
 * @returns {JSX.Element} Meditation timer interface
 */
export function MeditationTimer() {
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [totalSeconds, setTotalSeconds] = useState<number>(
    PRESETS[0].minutes * 60
  );
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    PRESETS[0].minutes * 60
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  /**
   * Handle preset selection
   * Resets timer to selected preset duration
   */
  const handlePresetSelect = useCallback((index: number) => {
    const newSeconds = PRESETS[index].minutes * 60;
    setSelectedPreset(index);
    setTotalSeconds(newSeconds);
    setRemainingSeconds(newSeconds);
    setIsRunning(false);
    setIsCompleted(false);
  }, []);

  /**
   * Start or pause the timer
   */
  const handleStartPause = useCallback(() => {
    if (isCompleted) {
      handleReset();
    } else {
      setIsRunning((prev) => !prev);
    }
  }, [isCompleted]);

  /**
   * Reset timer to selected preset duration
   */
  const handleReset = useCallback(() => {
    setRemainingSeconds(totalSeconds);
    setIsRunning(false);
    setIsCompleted(false);
  }, [totalSeconds]);

  /**
   * Timer countdown effect
   * Decrements remaining seconds every second when running
   */
  useEffect(() => {
    if (!isRunning || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setIsCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, remainingSeconds]);

  /**
   * Wake Lock effect
   * Prevents screen from turning off while timer is running
   */
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && isRunning) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        // Wake Lock API not supported or failed
        console.warn('Wake Lock API not available:', err);
      }
    };

    if (isRunning) {
      requestWakeLock();
    }

    return () => {
      if (wakeLock) {
        wakeLock.release();
      }
    };
  }, [isRunning]);

  return (
    <div className='flex min-h-screen flex-col items-center justify-center gap-12 bg-black p-4'>
      {/* Preset buttons */}
      <div className='flex gap-6'>
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

      {/* Timer display */}
      <div className='flex items-center justify-center gap-1 text-9xl leading-none text-white' style={{ fontFamily: 'var(--font-manrope)', fontWeight: 200 }}>
        <SlidingNumber value={minutes} padStart={true} />
        <span className='text-zinc-600'>:</span>
        <SlidingNumber value={seconds} padStart={true} />
      </div>

      {/* Control buttons */}
      <div className='flex gap-8'>
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
      </div>

      {/* Completion message */}
      {isCompleted && (
        <div className='font-mono text-sm text-white'>
          complete
        </div>
      )}
    </div>
  );
}
