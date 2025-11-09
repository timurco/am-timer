'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * Props for the SlidingNumber component
 * @interface SlidingNumberProps
 */
interface SlidingNumberProps {
  /** The numeric value to display */
  value: number;
  /** Whether to pad the number with leading zeros */
  padStart?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for individual digit component
 * @interface DigitProps
 */
interface DigitProps {
  /** Current digit value (0-9) */
  value: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Individual digit component with sliding animation
 * Contains stack of all digits (0-9) and slides to show current value
 *
 * @param {DigitProps} props - Component props
 * @returns {JSX.Element} Animated digit display
 */
function Digit({ value, className }: DigitProps) {
  const spring = useSpring(value, {
    stiffness: 280,
    damping: 18,
    mass: 0.3,
  });

  const y = useTransform(spring, (latest) => {
    return `${-latest * 100}%`;
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <span
      className={cn(
        'relative inline-block w-[1ch] overflow-y-clip tabular-nums',
        className
      )}
    >
      <span className='invisible'>0</span>
      <motion.span
        style={{ y }}
        className='absolute inset-0 flex flex-col items-center'
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <span key={num} className='flex h-full items-center justify-center'>
            {num}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/**
 * Animated number component with sliding transition effect
 * Displays numbers with smooth vertical sliding animation when value changes
 * Each digit animates independently for smooth transitions
 *
 * @param {SlidingNumberProps} props - Component props
 * @returns {JSX.Element} Animated number display
 */
export function SlidingNumber({
  value,
  padStart = false,
  className,
}: SlidingNumberProps) {
  const stringValue = padStart
    ? value.toString().padStart(2, '0')
    : value.toString();

  return (
    <span className={cn('inline-flex', className)}>
      {stringValue.split('').map((digit, index) => (
        <Digit key={index} value={parseInt(digit, 10)} />
      ))}
    </span>
  );
}
