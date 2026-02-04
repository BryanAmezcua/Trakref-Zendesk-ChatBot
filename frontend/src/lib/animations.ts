// Framer Motion animation variants

export const messageVariants = {
  hidden: {
    opacity: 0,
    y: 12,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0, 0, 0.2, 1] as const, // easeOut
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
    },
  },
};

export const fadeInUp = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.175, 0.885, 0.32, 1.275] as const, // spring
    },
  },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem = {
  hidden: {
    opacity: 0,
    y: 10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.175, 0.885, 0.32, 1.275] as const,
    },
  },
};

export const scaleIn = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0, 0, 0.2, 1] as const,
    },
  },
};

export const slideInRight = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0, 0, 0.2, 1] as const,
    },
  },
};

export const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

// Button interaction variants
export const buttonTap = {
  scale: 0.96,
  transition: { duration: 0.1 },
};

export const buttonHover = {
  scale: 1.02,
  transition: { duration: 0.15 },
};

// Chip/prompt suggestion variants
export const chipVariants = {
  initial: {
    opacity: 0,
    y: 8,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  hover: {
    y: -2,
    boxShadow: '0 4px 12px rgba(0, 133, 155, 0.15)',
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.98,
  },
};

// Loading dots animation
export const loadingDotVariants = {
  initial: { opacity: 0.4, scale: 0.85 },
  animate: {
    opacity: [0.4, 1, 0.4],
    scale: [0.85, 1, 0.85],
    transition: {
      duration: 1.4,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
};
