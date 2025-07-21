import { svelte } from "@sveltejs/vite-plugin-svelte";
import path, { resolve } from "node:path";
import { type UserConfig } from "vite";
import { spritesheet } from "./plugins/image-spritesheet-plugin";
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
        spritesheet({"common":"common"},undefined,[
            {name:"very-low",scale:0.35},
            {name:"low",scale:0.5},
            {name:"medium",scale:0.75},
            {name:"high",scale:1},
            {name:"very-high",scale:2},
            {name:"ultra",scale:3.5},
        ]),
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
