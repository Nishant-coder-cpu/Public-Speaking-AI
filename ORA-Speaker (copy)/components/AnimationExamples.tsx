'use client';

/**
 * Example component demonstrating animation wrapper usage
 * This file can be used for testing and as a reference
 */

import { FadeIn, SlideUp, ScaleIn } from '@/components/AnimationWrappers';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, hoverLift } from '@/lib/animations';

export const AnimationExamples = () => {
  return (
    <div className="space-y-8 p-8">
      {/* FadeIn Example */}
      <FadeIn>
        <div className="p-4 bg-slate-800 rounded-2xl">
          <h3 className="text-white">FadeIn Animation</h3>
          <p className="text-slate-300">This content fades in from below</p>
        </div>
      </FadeIn>

      {/* SlideUp Example */}
      <SlideUp delay={0.2}>
        <div className="p-4 bg-slate-800 rounded-2xl">
          <h3 className="text-white">SlideUp Animation</h3>
          <p className="text-slate-300">This content slides up with a delay</p>
        </div>
      </SlideUp>

      {/* ScaleIn Example */}
      <ScaleIn delay={0.4}>
        <div className="p-4 bg-slate-800 rounded-2xl">
          <h3 className="text-white">ScaleIn Animation</h3>
          <p className="text-slate-300">This content scales in</p>
        </div>
      </ScaleIn>

      {/* Hover Lift Example */}
      <motion.div
        {...hoverLift}
        className="p-4 bg-slate-800 rounded-2xl cursor-pointer"
      >
        <h3 className="text-white">Hover Lift Animation</h3>
        <p className="text-slate-300">Hover over this to see the lift effect</p>
      </motion.div>

      {/* Stagger Children Example */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-4"
      >
        <h3 className="text-white">Stagger Children Animation</h3>
        {[1, 2, 3].map((item) => (
          <motion.div
            key={item}
            variants={staggerItem}
            className="p-4 bg-slate-800 rounded-2xl"
          >
            <p className="text-slate-300">Staggered item {item}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
