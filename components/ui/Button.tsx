import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion'; // Removed ForwardRefComponent import
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom';
import type { RefAttributes } from 'react';

// DraggableProps keys to omit for RouterLink compatibility
// These are properties specific to Framer Motion's drag functionality
const draggablePropKeys = [
    'onDrag', 'onDragStart', 'onDragEnd', 'onDragTransitionEnd',
    'drag', 'dragConstraints', 'dragControls', 'dragElastic', 'dragListener', 'dragMomentum',
    'dragPropagation', 'dragSnapToOrigin', 'dragTransition'
] as const;
type DraggablePropKey = typeof draggablePropKeys[number];


// Props common to both button and anchor styling and content
interface CommonButtonProps {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'light';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    children: React.ReactNode;
    icon?: React.ReactNode;
    iconPosition?: 'leading' | 'trailing';
    className?: string;
}

// Base motion props for button, omitting 'type' (managed by ActualButtonProps) and CommonButtonProps
type ButtonMotionBase = Omit<HTMLMotionProps<'button'>, 'type' | keyof CommonButtonProps>;

// Base motion props for anchor, omitting CommonButtonProps
type AnchorMotionBase = Omit<HTMLMotionProps<'a'>, keyof CommonButtonProps>;

// Props for a button element
interface ActualButtonProps extends CommonButtonProps, ButtonMotionBase {
    as?: 'button';
    href?: undefined; // Explicitly undefined for button type
    external?: never;
    target?: never;
    type?: 'button' | 'submit' | 'reset';
}

// Props for an anchor element
interface ActualAnchorProps extends CommonButtonProps, AnchorMotionBase {
    as?: 'a';
    href: string; // href is required for anchor type
    external?: boolean;
    target?: React.HTMLAttributeAnchorTarget;
    type?: never;
}

export type ButtonProps = ActualButtonProps | ActualAnchorProps;

// Type for motion-wrapped RouterLink
// It should accept RouterLinkProps and Framer Motion's core animation props (MotionProps)
// but not Framer's specialized event handlers like DraggableProps if they conflict.
type MotionRouterLinkProps = Omit<RouterLinkProps, DraggablePropKey> & Omit<HTMLMotionProps<'a'>, keyof RouterLinkProps | DraggablePropKey | keyof CommonButtonProps> & {
    // Ensure 'to' is part of the props if not already from RouterLinkProps
    to: RouterLinkProps['to'];
};


const MotionRouterLinkComponent = motion(RouterLink);


const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    children,
    icon,
    iconPosition = 'leading',
    className = '',
    as, // 'as' prop is used for type inference, not directly on DOM element unless needed
    ...rest // Contains all other props, specific to ActualButtonProps or ActualAnchorProps
}) => {

    const isAnchor = typeof (rest as ActualAnchorProps).href === 'string';

    const baseStyles = "inline-flex items-center justify-center font-semibold rounded-lg shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-secondary-dark transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-md gap-2";

    const variantStyles = {
        primary: 'bg-primary hover:bg-primary-dark text-white focus-visible:ring-primary-dark dark:focus-visible:ring-primary',
        secondary: 'bg-gray-700 hover:bg-gray-800 text-white focus-visible:ring-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 dark:focus-visible:ring-gray-500',
        outline: 'border-2 border-primary text-primary hover:bg-primary/10 dark:border-primary-light dark:text-primary-light dark:hover:bg-primary-light/10 focus-visible:ring-primary shadow-sm',
        ghost: 'text-primary hover:bg-primary/10 dark:text-primary-light dark:hover:bg-primary-light/10 focus-visible:ring-primary shadow-none hover:shadow-sm',
        danger: 'bg-red-500 hover:bg-red-600 text-white focus-visible:ring-red-500 shadow-md',
        success: 'bg-green-500 hover:bg-green-600 text-white focus-visible:ring-green-400 shadow-md',
        light: 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 focus-visible:ring-gray-400 shadow-sm'
    };

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-xs sm:text-sm',
        md: 'px-5 py-2.5 text-sm sm:text-base',
        lg: 'px-7 py-3 text-base sm:text-lg',
        xl: 'px-8 py-3.5 text-lg sm:text-xl',
    };

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    const content = (
        <>
            {icon && iconPosition === 'leading' && <span className="flex-shrink-0">{icon}</span>}
            {children}
            {icon && iconPosition === 'trailing' && <span className="flex-shrink-0">{icon}</span>}
        </>
    );

    const motionAnimProps = {
        whileHover: { y: -2, transition: { duration: 0.15, ease: "easeOut" } },
        whileTap: { scale: 0.97, y: 0, transition: { duration: 0.1, ease: "easeOut" } },
    };

    if (isAnchor) {
        const { href, external, target, ...anchorRestInferred } = rest as Omit<ActualAnchorProps, keyof CommonButtonProps | 'as'>;
        // anchorRestInferred is now effectively AnchorMotionBase
        const anchorRest = anchorRestInferred as AnchorMotionBase;


        const isActualExternalLink = external || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:');

        if (isActualExternalLink) {
            return (
                <motion.a
                    href={href}
                    target={target || '_blank'}
                    rel={target === '_blank' || external ? 'noopener noreferrer' : undefined}
                    className={combinedClassName}
                    {...motionAnimProps}
                    {...anchorRest}
                >
                    {content}
                </motion.a>
            );
        } else {
            // Internal link, use react-router-dom's Link wrapped with motion
            // anchorRest is Omit<HTMLMotionProps<'a'>, keyof CommonButtonProps>
            // We need to omit DraggablePropKeys from anchorRest
            const {
                // Destructure and omit draggable props by prefixing with _ (or assign to unique vars if needed)
                onDrag: _onDrag, onDragStart: _onDragStart, onDragEnd: _onDragEnd, onDragTransitionEnd: _onDragTransitionEnd,
                drag: _drag, dragConstraints: _dragConstraints, dragControls: _dragControls, dragElastic: _dragElastic,
                dragListener: _dragListener, dragMomentum: _dragMomentum, dragPropagation: _dragPropagation,
                dragSnapToOrigin: _dragSnapToOrigin, dragTransition: _dragTransition,
                ...restForRouterLink // Inferred type: Omit<HTMLMotionProps<'a'>, keyof CommonButtonProps | DraggablePropKey>
            } = anchorRest;

            return (
                <MotionRouterLinkComponent
                    to={href}
                    target={target}
                    className={combinedClassName}
                    {...motionAnimProps}
                    {...restForRouterLink}
                >
                    {content}
                </MotionRouterLinkComponent>
            );
        }
    }

    // If not an anchor, it's a button.
    const { type = 'button', ...buttonRestInferred } = rest as Omit<ActualButtonProps, keyof CommonButtonProps | 'as'>;
    // buttonRestInferred is now effectively ButtonMotionBase
    const buttonRest = buttonRestInferred as ButtonMotionBase;

    return (
        <motion.button
            type={type}
            className={combinedClassName}
            {...motionAnimProps}
            {...buttonRest}
        >
            {content}
        </motion.button>
    );
};

export default Button;
