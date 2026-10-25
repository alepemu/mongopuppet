import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // Separate processes (not worker threads), so file-system tests may use process.chdir().
    pool: "forks",
  },
})
