import { svelte } from "@sveltejs/vite-plugin-svelte";
import path, { resolve } from "node:path";
import { type UserConfig } from "vite";
import { spritesheet } from "./plugins/image-spritesheet-plugin";
import { AudiosLists } from "./plugins/audio_list.ts";
const config: UserConfig = {
    build: {
        rollupOptions: {
            chunkSizeWarningLimit: 2000,
            input: {
                main: resolve(__dirname, "../index.html"),
            },
            output: {
                assetFileNames(assetInfo) {
                    let path = "assets";
                    if(!assetInfo.names)return  `${path}/[name]-[hash][extname]`;
                    switch (assetInfo.names[0].split(".").at(-1)) {
                        case "css":
                            path = "styles";
                            break;
                        case "ttf":
                        case "woff":
                        case "woff2":
                            path = "fonts";
                    }
                    return `${path}/[name]-[hash][extname]`;
                },
                entryFileNames: "scripts/[name]-[hash].js",
                chunkFileNames: "scripts/[name]-[hash].js",
                manualChunks(id, _chunkInfo) {
                    if (id.includes("node_modules")) {
                        return "vendor";
                    }
                }
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
        ]),
        AudiosLists([{
            input:"public/sounds/game/common",
            output:"sounds/game/common.json"
        }])
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
