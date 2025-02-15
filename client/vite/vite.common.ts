import { svelte } from "@sveltejs/vite-plugin-svelte";
import path, { resolve } from "node:path";
import { type UserConfig } from "vite";

const config: UserConfig = {
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "../index.html"),
            }
        }
    },

    plugins: [
        svelte(),
    ],

    css: {
        preprocessorOptions: {
            scss: {
                api: "modern-compiler"
            }
        }
    },

    resolve: {
        alias: {
            "common": path.resolve(__dirname, "../../common")
        }
    },
};

export default config;
