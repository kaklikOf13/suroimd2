import { mergeConfig, type UserConfig } from "vite";

import common from "./vite.common.ts";

import { ConfigType } from "common/scripts/config/config.ts";
const con=require("../../common/scripts/config/config.json") as ConfigType
const config: UserConfig = {
    server: {
        port: 3000,
        strictPort: true,
        host: "0.0.0.0",
        proxy: {
            "/api": {
                target: con.api.global,
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ""),
            },
        },
    },
    preview: {
        port: 3000,
        strictPort: true,
        host: "0.0.0.0"
    },
};

export default mergeConfig(common, config);
