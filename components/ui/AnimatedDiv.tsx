
import React, { useEffect, useRef } from 'react';
import { motion, useAnimation, Variants } from 'framer-motion';
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
  tag?: keyof JSX.IntrinsicElements; // Allow specifying HTML tag
}

const animationVariants: Record<AnimationType, Variants> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  fadeInUp: {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  },
  fadeInDown: {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0 },
  },
  fadeInLeft: {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
  },
  fadeInRight: {
    hidden: { opacity: 0, x: -50 },
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
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1 },
  }
};

const AnimatedDiv: React.FC<AnimatedDivProps> = ({
  children,
  animation = 'fadeInUp',
  duration = 0.6,
  delay = 0,
  className,
  threshold = 0.1,
  triggerOnce = true,
  tag = 'div'
}) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold, triggerOnce });
  const MotionComponent = motion[tag];


  useEffect(() => {
    if (inView) {
      controls.start('visible');
    } else if (!triggerOnce) {
      controls.start('hidden');
    }
  }, [controls, inView, triggerOnce]);

  return (
    <MotionComponent
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={animationVariants[animation]}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </MotionComponent>
  );
};

export default AnimatedDiv;
