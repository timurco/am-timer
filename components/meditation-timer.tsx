'use client';

import { SlidingNumber } from '@/components/core/sliding-number';
import { useEffect, useState, useCallback } from 'react';

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
  { label: '15 min', seconds: 15*60 },
  { label: '10 min', seconds: 10*60 },
  { label: '30 min', seconds: 30*60 },
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
    PRESETS[0].seconds
  );
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    PRESETS[0].seconds
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
      <div className='flex flex-col items-center gap-6'>
        <div className='flex items-center justify-center gap-1 text-9xl leading-none text-white' style={{ fontFamily: 'var(--font-manrope)', fontWeight: 200 }}>
          <SlidingNumber value={minutes} padStart={true} />
          <span className='text-zinc-600'>:</span>
          <SlidingNumber value={seconds} padStart={true} />
        </div>

        {/* Progress bar */}
        <div className='h-1 w-full overflow-hidden rounded-full' style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
          <div
            className='h-full rounded-full transition-all duration-1000 ease-linear'
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
