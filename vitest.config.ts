import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "nodeTest",
    environment: "node",
    coverage: {
      provider: "istanbul",
      reporter: ["text", "html", "json", "lcov"],
    },
  },
});
