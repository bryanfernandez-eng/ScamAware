/**
 * Merge class names (utility for conditional Tailwind classes).
 * @param {...string} classes
 * @returns {string}
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
