/**
 * Utility Functions
 */

/**
 * Utility for joining class names
 */
export const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(" ");
