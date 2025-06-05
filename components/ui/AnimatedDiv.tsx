
import React, { useEffect } from 'react';
import { motion, useAnimation, Variants, HTMLMotionProps } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

type AnimationType = 
  | 'fadeIn' 
  | 'fadeInUp' 
  | 'fadeInDown' 
  | 'fadeInLeft' 
  | 'fadeInRight'
  | 'slideInUp'
  | 'slideInDown'
  | 'slideInLeft'
  | 'slideInRight'
  | 'zoomIn';

interface AnimatedDivProps {
  children: React.ReactNode;
  animation?: AnimationType;
  duration?: number;
  delay?: number;
  className?: string;
  threshold?: number;
  triggerOnce?: boolean;
  tag?: keyof typeof motion; // More specific type for motion components
  // Allow any other props that motion components accept
  [key: string]: any; 
}

const animationVariants: Record<AnimationType, Variants> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  fadeInUp: {
    hidden: { opacity: 0, y: 40 }, // Increased initial y for more noticeable effect
    visible: { opacity: 1, y: 0 },
  },
  fadeInDown: {
    hidden: { opacity: 0, y: -40 }, // Increased initial y
    visible: { opacity: 1, y: 0 },
  },
  fadeInLeft: {
    hidden: { opacity: 0, x: 40 }, // Increased initial x
    visible: { opacity: 1, x: 0 },
  },
  fadeInRight: {
    hidden: { opacity: 0, x: -40 }, // Increased initial x
    visible: { opacity: 1, x: 0 },
  },
  slideInUp: {
    hidden: { y: '100%', opacity: 0 },
    visible: { y: '0%', opacity: 1 },
  },
  slideInDown: {
    hidden: { y: '-100%', opacity: 0 },
    visible: { y: '0%', opacity: 1 },
  },
  slideInLeft: {
    hidden: { x: '100%', opacity: 0 },
    visible: { x: '0%', opacity: 1 },
  },
  slideInRight: {
    hidden: { x: '-100%', opacity: 0 },
    visible: { x: '0%', opacity: 1 },
  },
  zoomIn: {
    hidden: { scale: 0.85, opacity: 0 }, // Adjusted scale
    visible: { scale: 1, opacity: 1 },
  }
};

const AnimatedDiv: React.FC<AnimatedDivProps> = ({
  children,
  animation = 'fadeInUp',
  duration = 0.6,
  delay = 0,
  className,
  threshold = 0.1, // Lower threshold to trigger sooner
  triggerOnce = true,
  tag = 'div',
  ...rest // Spread remaining props to the motion component
}) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold, triggerOnce });
  
  // Cast `tag` to any to satisfy motion[tag] indexing
  const MotionComponent = motion[tag as keyof typeof motion] as React.ComponentType<HTMLMotionProps<any>>;


  useEffect(() => {
    if (inView) {
      controls.start('visible');
    } else if (!triggerOnce) {
      // If not triggerOnce, ensure it resets to hidden when out of view
      controls.start('hidden');
    }
  }, [controls, inView, triggerOnce]);
  
  // If triggerOnce is false, we need to set initial state to hidden if not in view
  const initial = triggerOnce ? "hidden" : (inView ? "visible" : "hidden");

  return (
    <MotionComponent
      ref={ref}
      initial={initial}
      animate={controls}
      variants={animationVariants[animation]}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
      {...rest} // Apply any additional props
    >
      {children}
    </MotionComponent>
  );
};

export default AnimatedDiv;
