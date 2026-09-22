import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
      "@phosphor-icons/react": path.resolve(process.cwd(), "src/icons.jsx"),
      "phosphor-native": path.resolve(process.cwd(), "node_modules/@phosphor-icons/react/dist/index.es.js"),
    },
  },
  test: {
    environment: "node",
  },
});
