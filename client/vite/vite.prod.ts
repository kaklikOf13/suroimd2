import { mergeConfig, type UserConfig } from "vite";

import common from "./vite.common.ts";
import { ConfigType } from "common/scripts/config/config.ts";
import { readFileSync } from "node:fs";

const configM:ConfigType=JSON.parse(readFileSync("../config.json") as unknown as string)

const config: UserConfig = {
    server: {
        port: configM.vite.port,
        strictPort: true,
        host: "0.0.0.0"

    },
    preview: {
        port: configM.vite.port,
        strictPort: true,
        host: "0.0.0.0"
    },
};

export default mergeConfig(common, config);
