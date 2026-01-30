import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Adjusts a date to represent IST (UTC+5:30) for display purposes.
 * This effectively adds 5.5 hours to the timestamp so that UTC-based formatters
 * render the correct day for Indian events.
 */
export function getISTDate(date: string | Date | undefined | null): Date {
  if (!date) return new Date();
  const d = new Date(date);
  // Add 5 hours 30 minutes in milliseconds
  return new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
}
