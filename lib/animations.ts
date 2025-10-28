/**
 * Animation variants and utilities for Framer Motion
 * Provides consistent animation patterns across the application
 */

import { Variants } from 'framer-motion';

/**
 * Fade in animation variant
 * Fades in from below with slight upward movement
 */
export const fadeIn: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

/**
 * Slide up animation variant
 * Slides up from below with fade in effect
 */
export const slideUp: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 40 },
};

/**
 * Scale in animation variant
 * Scales up from 95% with fade in effect
 */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

/**
 * Hover lift animation variant
 * Lifts element up slightly on hover
 */
export const hoverLift = {
  whileHover: { y: -4, transition: { duration: 0.2 } },
  whileTap: { scale: 0.98 },
};

/**
 * Shimmer animation variant
 * Creates a shimmer effect by animating background position
 */
export const shimmer: Variants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: { duration: 2, repeat: Infinity, ease: 'linear' },
  },
};

/**
 * Default transition configuration
 * Provides smooth easing for most animations
 */
export const defaultTransition = {
  duration: 0.4,
  ease: 'easeOut' as const,
};

/**
 * Spring transition configuration
 * Provides bouncy, natural feeling animations
 */
export const springTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

/**
 * Stagger children animation utility
 * Creates a staggered animation effect for child elements
 * 
 * @param staggerDelay - Delay between each child animation (default: 0.1s)
 * @returns Variants object with stagger configuration
 */
export const staggerChildren = (staggerDelay: number = 0.1): Variants => ({
  animate: {
    transition: {
      staggerChildren: staggerDelay,
    },
  },
});

/**
 * Stagger container variant
 * Use this on parent elements to stagger child animations
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/**
 * Stagger item variant
 * Use this on child elements within a stagger container
 */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};
