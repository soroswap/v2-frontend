/**
 * Centralized styles for the Stargate Campaign feature.
 * All reusable class combinations are defined here to ensure consistency.
 */

/**
 * Glass card effect - the main container style used throughout the feature.
 * Creates a frosted glass appearance with subtle shadow.
 */
export const glassCard = {
  base: [
    "relative rounded-3xl",
    "bg-surface/70 backdrop-blur-3xl",
    "border border-primary/5",
  ],
  shadow: "shadow-lg shadow-brand/5",
  shadowXl: "shadow-xl shadow-brand/5",
  padding: {
    default: "p-6",
    responsive: "p-6 md:p-8",
  },
} as const;

/**
 * Lock overlay - shown when a card is disabled/locked.
 */
export const lockOverlay = {
  container: [
    "absolute inset-0 z-20",
    "flex flex-col items-center justify-center",
    "rounded-3xl bg-black/20 backdrop-blur-3xl",
  ],
  iconContainer: [
    "flex h-16 w-16 items-center justify-center",
    "rounded-full bg-surface/80",
  ],
  icon: "h-8 w-8 text-secondary",
  text: "text-secondary mt-4 text-center text-sm font-medium",
} as const;

/**
 * Input field styles - for amount inputs and similar.
 */
export const inputField = {
  container: [
    "rounded-2xl p-4",
    "border border-primary/10",
    "bg-surface-subtle/50",
    "transition-colors focus-within:border-brand",
  ],
  containerReadonly: [
    "rounded-2xl p-4 opacity-90",
    "border border-primary/10",
    "bg-surface-subtle/50",
  ],
  input: [
    "text-primary w-full bg-transparent text-3xl font-bold outline-none",
    "placeholder:text-secondary",
  ],
  label: "text-secondary mb-2 block text-xs font-medium",
} as const;

/**
 * Stats box - small info boxes showing metrics.
 */
export const statsBox = {
  container: [
    "rounded-xl p-2.5 text-center",
    "border border-primary/5",
    "bg-surface-alt/50",
  ],
  label: "text-secondary mb-1 text-[10px] font-medium uppercase tracking-wider",
  value: "text-primary text-base font-bold",
} as const;

/**
 * Decorative elements - gradients and blurs for visual interest.
 */
export const decorations = {
  topGradientLine: [
    "pointer-events-none absolute top-0 left-0",
    "h-1 w-full",
    "bg-linear-to-r from-transparent via-brand to-transparent opacity-20",
  ],
  cornerBlur: [
    "pointer-events-none absolute top-0 right-0",
    "h-32 w-32 rounded-bl-full bg-brand/10 blur-2xl",
  ],
  bottomBlur: [
    "pointer-events-none absolute -bottom-10 -right-10",
    "h-40 w-40 rounded-full blur-3xl",
    "bg-brand/10",
  ],
} as const;

/**
 * Icon containers - styled containers for icons.
 */
export const iconContainer = {
  // Gradient icon box (e.g., vault icon)
  gradient: [
    "flex items-center justify-center rounded-xl",
    "bg-linear-to-br from-indigo-500 to-brand",
    "shadow-lg shadow-indigo-500/20",
  ],
  gradientBrandBlue: [
    "flex items-center justify-center rounded-xl",
    "bg-linear-to-tr from-brand to-blue-500",
    "shadow-lg shadow-brand/20",
  ],
  // Sizes
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
} as const;

/**
 * Button effects - shadow and hover states for buttons.
 */
export const buttonEffects = {
  glow: [
    "shadow-lg shadow-brand/20",
    "transition-all hover:shadow-xl hover:shadow-brand/30",
  ],
} as const;

/**
 * Token/currency badge - small badge showing token info.
 */
export const tokenBadge = {
  container: [
    "flex cursor-pointer items-center gap-2",
    "rounded-lg px-2 py-1 shadow-sm",
    "bg-surface",
  ],
  icon: "flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white",
  text: "text-primary font-medium",
} as const;

/**
 * APY badge - shows APY percentage.
 */
export const apyBadge = [
  "rounded-md px-2 py-1 text-[10px] font-bold",
  "bg-blue-100 text-blue-600",
  "dark:bg-blue-900/30 dark:text-blue-400",
] as const;

/**
 * Section header - card headers.
 */
export const sectionHeader = {
  container: "mb-6 flex items-center justify-between",
  title: "text-primary text-xl font-bold",
} as const;

/**
 * Arrow divider - used between input fields.
 */
export const arrowDivider = {
  container: "relative z-10 -my-2 flex justify-center",
  circle: [
    "rounded-full border-4 border-surface p-2",
    "bg-surface-subtle",
  ],
  icon: "text-brand h-5 w-5",
} as const;

/**
 * Stepper styles - for the progress stepper.
 */
export const stepper = {
  step: {
    base: [
      "relative z-10 flex h-8 w-8 items-center justify-center rounded-full",
      "transition-all duration-300",
    ],
    completed: [
      "bg-brand",
      "shadow-[0_0_20px_4px] shadow-brand/40",
      "ring-2 ring-brand/30 ring-offset-2 ring-offset-transparent",
    ],
    current: [
      "border-2 border-brand",
      "bg-surface",
      "shadow-lg shadow-brand/20",
    ],
    upcoming: [
      "border border-primary/10",
      "bg-surface-alt/50",
    ],
  },
  glow: "absolute h-8 w-8 animate-pulse rounded-full bg-brand/20 blur-md",
  connector: {
    base: "h-0.5 w-12 sm:w-20",
    completed: "bg-brand",
    upcoming: "bg-primary/10",
  },
  label: {
    base: "mt-2 hidden text-center text-[10px] font-medium sm:block max-w-20 leading-tight",
    completed: "text-brand",
    current: "text-primary",
    upcoming: "text-secondary",
  },
} as const;

/**
 * Skeleton loader - for loading states.
 */
export const skeleton = {
  base: "animate-pulse rounded",
  bg: "bg-surface-skeleton-start",
} as const;

/**
 * Quick action link - for sidebar action buttons.
 */
export const quickActionLink = [
  "flex w-full items-center justify-between rounded-xl p-4",
  "bg-surface/50 backdrop-blur-md",
  "border border-primary/5",
  "text-secondary transition-colors",
  "hover:bg-surface-hover/50",
] as const;
