'use client';

/**
 * Reusable Framer Motion wrapper components
 * Provides consistent animation patterns across the application
 */

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import { fadeIn, slideUp, scaleIn, defaultTransition } from '@/lib/animations';

interface AnimationWrapperProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  delay?: number;
}

/**
 * FadeIn wrapper component
 * Fades in content from below with slight upward movement
 * 
 * @param children - Content to animate
 * @param delay - Optional delay before animation starts (in seconds)
 */
export const FadeIn = ({ children, delay = 0, ...props }: AnimationWrapperProps) => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeIn}
      transition={{ ...defaultTransition, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * SlideUp wrapper component
 * Slides content up from below with fade in effect
 * 
 * @param children - Content to animate
 * @param delay - Optional delay before animation starts (in seconds)
 */
export const SlideUp = ({ children, delay = 0, ...props }: AnimationWrapperProps) => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={slideUp}
      transition={{ ...defaultTransition, delay, duration: 0.5 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * ScaleIn wrapper component
 * Scales content up from 95% with fade in effect
 * 
 * @param children - Content to animate
 * @param delay - Optional delay before animation starts (in seconds)
 */
export const ScaleIn = ({ children, delay = 0, ...props }: AnimationWrapperProps) => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={scaleIn}
      transition={{ ...defaultTransition, delay, duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
