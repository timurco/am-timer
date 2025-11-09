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

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-4'>
      <div className='w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl'>
        {/* Title */}
        <div className='text-center'>
          <h1 className='text-3xl font-bold text-zinc-50'>
            Meditation Timer
          </h1>
          <p className='mt-2 text-sm text-zinc-400'>
            Choose a duration and start your practice
          </p>
        </div>

        {/* Preset buttons */}
        <div className='flex gap-3'>
          {PRESETS.map((preset, index) => (
            <button
              key={preset.label}
              onClick={() => handlePresetSelect(index)}
              disabled={isRunning}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                selectedPreset === index
                  ? 'bg-zinc-50 text-zinc-900'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              } ${
                isRunning ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Timer display */}
        <div className='flex items-center justify-center gap-1 py-12 font-mono text-8xl font-bold leading-none text-zinc-50'>
          <SlidingNumber value={minutes} padStart={true} />
          <span className='text-zinc-500'>:</span>
          <SlidingNumber value={seconds} padStart={true} />
        </div>

        {/* Progress bar */}
        <div className='h-1 overflow-hidden rounded-full bg-zinc-800'>
          <div
            className='h-full rounded-full bg-zinc-50 transition-all duration-1000 ease-linear'
            style={{
              width: `${((totalSeconds - remainingSeconds) / totalSeconds) * 100}%`,
            }}
          />
        </div>

        {/* Control buttons */}
        <div className='flex gap-3'>
          <button
            onClick={handleStartPause}
            className={`flex-1 rounded-lg px-6 py-3 font-medium transition-all ${
              isCompleted
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : isRunning
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-zinc-50 text-zinc-900 hover:bg-zinc-200'
            }`}
          >
            {isCompleted ? 'Restart' : isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={handleReset}
            disabled={!isRunning && !isCompleted && remainingSeconds === totalSeconds}
            className='rounded-lg bg-zinc-800 px-6 py-3 font-medium text-zinc-300 transition-all hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50'
          >
            Reset
          </button>
        </div>

        {/* Completion message */}
        {isCompleted && (
          <div className='text-center text-lg font-semibold text-emerald-400'>
            Session complete! 🧘‍♀️
          </div>
        )}
      </div>
    </div>
  );
}
