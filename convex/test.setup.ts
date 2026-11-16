/// <reference types="vite/client" />

/** The function modules of convex/, for `convexTest`: every module but a test, a declaration file or this one. */
export const modules = import.meta.glob([
  "./**/*.{ts,js}",
  "!./**/*.test.ts",
  "!./**/*.d.ts",
  "!./test.setup.ts",
]);
