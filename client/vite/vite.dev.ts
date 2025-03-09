import { mergeConfig, type UserConfig } from "vite";

import common from "./vite.common.ts";

const config: UserConfig = {
    server: {
        port: 3000,
        strictPort: true,
        host: "0.0.0.0",
    },
    preview: {
        port: 3000,
        strictPort: true,
        host: "0.0.0.0"
    },
};

export default mergeConfig(common, config);
