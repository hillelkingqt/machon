
import React from 'react';
import { motion } from 'framer-motion';

// Define Omit type helper if not available globally (e.g. older TS)
// type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

type HTMLDragEvents = 
  | 'onDrag' 
  | 'onDragEnd' 
  | 'onDragEnter' 
  | 'onDragExit' // Changed from onDragExi
  | 'onDragLeave' 
  | 'onDragOver' 
  | 'onDragStart' 
  | 'onDrop';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLDragEvents> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  external?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  href,
  external,
  children,
  icon,
  className = '',
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-secondary-dark transition-all duration-200 ease-in-out transform hover:scale-[1.03] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed";

  const variantStyles = {
    primary: 'bg-primary hover:bg-primary-dark text-white focus:ring-primary-dark dark:focus:ring-primary',
    secondary: 'bg-gray-700 hover:bg-gray-800 text-white focus:ring-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 dark:focus:ring-gray-500',
    outline: 'border-2 border-primary text-primary hover:bg-primary/10 dark:border-primary-light dark:text-primary-light dark:hover:bg-primary-light/10 focus:ring-primary',
    ghost: 'text-primary hover:bg-primary/10 dark:text-primary-light dark:hover:bg-primary-light/10 focus:ring-primary shadow-none hover:shadow-sm',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    success: 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-400',
  };

  const sizeStyles = {
    sm: 'px-3.5 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
  };

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  if (href) {
    return (
      <motion.a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className={combinedClassName}
        whileHover={{ y: -2, transition: { duration: 0.1 } }}
        whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
      >
        {icon && <span className="me-2.5 rtl:ms-2.5 rtl:me-0">{icon}</span>}
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      className={combinedClassName}
      whileHover={{ y: -2, transition: { duration: 0.1 } }}
      whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
      {...props} // Native HTML button attributes (excluding conflicting drag events) are spread here
    >
      {icon && <span className="me-2.5 rtl:ms-2.5 rtl:me-0">{icon}</span>}
      {children}
    </motion.button>
  );
};

export default Button;
