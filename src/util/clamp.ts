"use strict";

export default function clamp(n: number, low: number, high: number): number {
  if (low > high) return clamp(n, high, low);
  if (n < low) return low;
  if (n > high) return high;
  return n;
}
