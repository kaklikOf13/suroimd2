import { existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import devConfig from "./vite/vite.dev.ts";
import prodConfig from "./vite/vite.prod.ts";

const DIRNAME = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command, mode }) => {
    if (command === "serve" && mode === "development") {
        if (existsSync(resolve(DIRNAME, "./dist"))) { 
            rmSync(resolve(DIRNAME, "./dist"), { recursive: true, force: true });
        }
    }

    return command === "serve" ? devConfig : prodConfig;
});
