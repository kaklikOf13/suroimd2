// vite-plugin-audios-list.ts
import path from "node:path";
import process from "node:process";
import { type FSWatcher, type Plugin, type ResolvedConfig } from "vite";
import { watch } from "chokidar";
import * as fs from "node:fs";
import readDirectory from "./utils/readDirectory.ts";

const PLUGIN_NAME = "vite-audios-list";

export interface AudioListConfig {
    input: string;
    output: string;
}
export interface AudioList {
    files: Record<string, string>;
}

function generateAudioList(absInput: string): string[] {
    const files = readDirectory(absInput);
    return files
        .filter(f => /\.(mp3|ogg|wav|flac)$/i.test(f))
        .map(f => {
            // Remove o "public/" do início do caminho absoluto
            const rel = path.relative(path.resolve(process.cwd(), "public"), f);
            return rel.replace(/\\/g, "/"); // Garantir que use /
        });
}


export function AudiosLists(configs: AudioListConfig[]): Plugin[] {
    let watcher: FSWatcher;
    let buildTimeout: NodeJS.Timeout | undefined;
    let viteConfig: ResolvedConfig;

    async function buildAll(): Promise<Record<string, AudioList>> {
        const ret: Record<string, AudioList> = {};
        for (const { input, output } of configs) {
            const absInput = path.resolve(process.cwd(), input);
            const absOutput = path.resolve(process.cwd(), output);

            if (!fs.existsSync(absInput)) {
                console.warn(`[${PLUGIN_NAME}] Input path not found: ${absInput}`);
                continue;
            }

            const audios = generateAudioList(absInput);

            const files: Record<string, string> = {};
            for (const a of audios) {
                const name = path.basename(a).split(".")[0];
                files[name] = a;
            }

            ret[output] = { files };
            console.log(`[${PLUGIN_NAME}] Generated ${absOutput} (${Object.keys(files).length} files)`);
        }
        return ret;
    }

    return [
        {
            name: `${PLUGIN_NAME}:build`,
            apply: "build",
            async buildStart() {
                const ff = await buildAll();
                for (const e of Object.keys(ff)) {
                    this.emitFile({
                        type: "asset",
                        fileName: e,
                        source: JSON.stringify(ff[e], null, 2)
                    });
                }
            }
        },
        {
            name: `${PLUGIN_NAME}:serve`,
            apply: "serve",
            configResolved(cfg) {
                viteConfig = cfg;
            },
            async configureServer(server) {
                const files = new Map<string, string>();

                async function rebuild(): Promise<void> {
                    clearTimeout(buildTimeout!);
                    buildTimeout = setTimeout(async () => {
                        const bb = await buildAll();
                        files.clear();
                        for (const file of Object.keys(bb)) {
                            files.set(file, JSON.stringify(bb[file], null, 2));
                        }
                        console.log(`[${PLUGIN_NAME}] Audio list updated`);
                    }, 300);
                }

                watcher = watch(
                    configs.map(c => path.resolve(process.cwd(), c.input)),
                    { ignoreInitial: true }
                )
                    .on("add", rebuild)
                    .on("unlink", rebuild)
                    .on("change", rebuild);

                // Build inicial no modo serve
                const initial = await buildAll();
                for (const file of Object.keys(initial)) {
                    files.set(file, JSON.stringify(initial[file], null, 2));
                }

                return () => {
                    server.middlewares.use((req, res, next) => {
                        if (!req.originalUrl) return next();

                        const file = files.get(req.originalUrl.slice(1));
                        if (file === undefined) return next();

                        res.writeHead(200, {
                            "Content-Type": "application/json"
                        });
                        res.end(file);
                    });
                };
            },
            closeBundle: async () => {
                await watcher.close();
            }
        }
    ];
}
