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
  { label: '10 min', seconds: 10*60 },
  { label: '15 min', seconds: 15*60 },
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
  const [flashCount, setFlashCount] = useState<number>(0);
  const [flashIntensity, setFlashIntensity] = useState<number>(0);
  const [targetTimestamp, setTargetTimestamp] = useState<number | null>(null);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

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
      } else {
        setRemainingSeconds(remaining);
      }
    }, 100); // Update every 100ms for smooth countdown

    return () => clearInterval(interval);
  }, [isRunning, targetTimestamp]);

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
      <div className='flex flex-col items-center relative'>
        <div
          className='flex items-center justify-center gap-1 text-9xl leading-none relative p-8'
          style={{ fontFamily: 'var(--font-manrope)', fontWeight: 200 }}
        >
          {/* Flash background */}
          {isCompleted && flashCount < 5 && (
            <div
              className='absolute inset-0'
              style={{
                backgroundColor: `rgba(239, 68, 68, ${flashIntensity * 0.8})`,
              }}
            />
          )}

          {/* Timer numbers */}
          <div className={`relative z-10 flex items-center gap-1 ${flashCount >= 5 ? 'text-zinc-600' : 'text-white'}`}>
            <SlidingNumber value={minutes} padStart={true} />
            <span className='text-zinc-600'>:</span>
            <SlidingNumber value={seconds} padStart={true} />
          </div>
        </div>

        {/* Progress bar */}
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

    </div>
  );
}
