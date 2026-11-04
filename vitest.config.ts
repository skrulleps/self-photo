import { configDefaults ,defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
    test: {
        exclude: ["**/node_modules/**", "**/dist/**", "tests/e2e/**", ...configDefaults.exclude],
        include: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./"),
        },
    },
});