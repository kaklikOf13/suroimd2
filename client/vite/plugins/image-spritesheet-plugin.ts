import { watch } from "chokidar";
import { Minimatch } from "minimatch";
import path, { resolve } from "node:path";
import { type FSWatcher, type Plugin, type ResolvedConfig } from "vite";
import readDirectory from "./utils/readDirectory.ts";
import { CacheData, cacheDir, type CompilerOptions, createSpritesheets, type MultiResAtlasList } from "./utils/spritesheet.ts";
import { mkdir, readFile, stat } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { SpritesheetJSON } from "../../src/scripts/engine/resources.ts";

const PLUGIN_NAME = "vite-spritesheet-plugin";

const defaultGlob = "**/*.{png,gif,jpg,bmp,tiff,svg}";
const imagesMatcher = new Minimatch(defaultGlob);

const compilerOpts = {
    outputFormat: "png",
    outDir: "atlases",
    margin: 8,
    removeExtensions: true,
    maximumSize: 4096,
    name: "atlas",
    packerOptions: {}
} satisfies CompilerOptions as CompilerOptions;

const getImageDirs = (atlases:Record<string,string>,imageDirs: string[] = []): string[] => {
    for(const a in atlases){
        const value = atlases[a as keyof typeof atlases];
        imageDirs.push(`public/img/game/${value}`);
    }
    return imageDirs
};
interface buildSpritesheetRet{atlas:MultiResAtlasList,dirs:string[]}

async function buildSpritesheets(imageDirs:string[]): Promise<buildSpritesheetRet> {
    const fileMap: Record<string,Map<string, { lastModified: number, path: string }>>={};
    const ff=new Map<string, { lastModified: number, path: string }>()
    
    // Maps have unique keys.
    // Since the filename is used as the key, and mode sprites are added to the map after the common sprites,
    // this method allows mode sprites to override common sprites with the same filename.
    for(const id of imageDirs){
        const m=new Map<string, { lastModified: number, path: string }>()
        for (const imagePath of readDirectory(id).filter(x => imagesMatcher.match(x))) {
            const imageFileInfo = await stat(imagePath);
            const { mtime, ctime } = imageFileInfo;
            
            const n=imagePath.slice(imagePath.lastIndexOf(path.sep))
            const s={
                path: imagePath,
                lastModified: Math.max(mtime.getTime(), ctime.getTime())
            }
            m.set(n,s)
            ff.set(n,s)
        }
        fileMap[path.basename(id)]=m
    }

    let isCached = true;
    if (!existsSync(cacheDir)) {
        await mkdir(cacheDir);
        isCached = false;
    }
    if (!existsSync(path.join(cacheDir, "data.json"))) isCached = false;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const cacheData: CacheData = existsSync(path.join(cacheDir, "data.json"))
        ? JSON.parse(await readFile(path.join(cacheDir, "data.json"), "utf8"))
        : {
            lastModified: Date.now(),
            fileMap: {},
            atlasFiles: {
                low: [],
                high: []
            }
        };

    if (Array.from(ff.values()).find(f => f.lastModified > cacheData.lastModified)) isCached = false;

    if (Object.entries(cacheData.fileMap).find(([name, path]) => ff.get(name)?.path === path)) isCached = false;
    if (Array.from(ff.entries()).find(([name, data]) => data.path === cacheData.fileMap[name])) isCached = false;

    if (isCached) {
        console.log("Spritesheets are cached! Skipping build.");
        const ret:MultiResAtlasList={
            high:{},
            low:{}
        }
        for(const kk of Object.keys(cacheData.atlasFiles.low)){
            ret.low[kk]=[]
            ret.high[kk]=[]
            for(const ii in cacheData.atlasFiles.low[kk]){
                ret.low[kk].push({
                    json: JSON.parse(await readFile(path.join(cacheDir, `${cacheData.atlasFiles.low[kk][ii]}.json`), "utf8")) as SpritesheetJSON,
                    image: await readFile(path.join(cacheDir, `${cacheData.atlasFiles.low[kk][ii]}.png`)),
                })
            }
            for(const ii in cacheData.atlasFiles.high[kk]){
                ret.high[kk].push({
                    json: JSON.parse(await readFile(path.join(cacheDir, `${cacheData.atlasFiles.high[kk][ii]}.json`), "utf8")) as SpritesheetJSON,
                    image: await readFile(path.join(cacheDir, `${cacheData.atlasFiles.high[kk][ii]}.png`)),
                })
            }
        }
        return {atlas:ret,dirs:imageDirs}
    }

    console.log("Building spritesheets...");

    return {atlas:await createSpritesheets(fileMap, compilerOpts),dirs:imageDirs};
}

const SpriteSheetDirId = "virtual:spritesheets-dir";
const SpriteSheetDirIdVirtualMod = `\0${SpriteSheetDirId}`;

const resolveId = (id: string): string | undefined => {
    switch (id) {
        case SpriteSheetDirIdVirtualMod: return SpriteSheetDirId;
    }
};

export function spritesheet(atlas_list:Record<string,string>,dest_dir:string="atlases"): Plugin[] {
    let watcher: FSWatcher;
    let config: ResolvedConfig;

    let atlases: buildSpritesheetRet;
    let spriteSheetDir=cacheDir

    const load = (id: string): string | undefined => {
        switch (id) {
            case SpriteSheetDirId: return `export const atlases = ${spriteSheetDir}`;
        }
    };

    const imageDirs = getImageDirs(atlas_list).reverse();

    let buildTimeout: NodeJS.Timeout | undefined;

    return [
        {
            name: `${PLUGIN_NAME}:build`,
            apply: "build",
            async buildStart() {
                atlases = await buildSpritesheets(imageDirs);
                spriteSheetDir="atlas/"
            },
            generateBundle() {
                for(const k of Object.keys(atlases.atlas.high)){
                    const nn={
                        low:[] as SpritesheetJSON[],
                        high:[] as SpritesheetJSON[]
                    }
                    for (const sheet of atlases.atlas.high[k]) {
                        this.emitFile({
                            type: "asset",
                            fileName: sheet.json.meta.image,
                            source: sheet.image
                        });
                        this.info("Built spritesheets");
                        nn.high.push(sheet.json)
                    }
                    for (const sheet of atlases.atlas.low[k]) {
                        this.emitFile({
                            type: "asset",
                            fileName: sheet.json.meta.image,
                            source: sheet.image
                        });
                        this.info("Built spritesheets");
                        nn.low.push(sheet.json)
                    }
                    this.emitFile({
                        type: "asset",
                        fileName: `${dest_dir}/atlas-${k}-data.json`,
                        source: JSON.stringify(nn)
                    });
                }
            },
            resolveId,
            load
        },
        {
            name: `${PLUGIN_NAME}:serve`,
            apply: "serve",
            configResolved(cfg) {
                config = cfg;
            },
            async configureServer(server) {
                function reloadPage(): void {
                    clearTimeout(buildTimeout);

                    buildTimeout = setTimeout(() => {
                        buildSheets().then(() => {
                            const module = server.moduleGraph.getModuleById(SpriteSheetDirIdVirtualMod);
                            if (module !== undefined) void server.reloadModule(module);
                        }).catch(e => console.error(e));
                    }, 500);
                }

                watcher = watch((imageDirs).map(pattern => resolve(pattern, defaultGlob)), {
                    cwd: config.root,
                    ignoreInitial: true
                })
                    .on("add", reloadPage)
                    .on("change", reloadPage)
                    .on("unlink", reloadPage);

                const files = new Map<string, Buffer | string>();

                async function buildSheets(): Promise<void> {
                    atlases = await buildSpritesheets(imageDirs);

                    files.clear();
                    for(const k of Object.keys(atlases.atlas.low)){
                        const nn={
                            low:[] as SpritesheetJSON[],
                            high:[] as SpritesheetJSON[]
                        }
                        
                        for (const sheet of atlases.atlas.high[k]) {
                            files.set(sheet.json.meta.image!, sheet.image);
                            nn.high.push(sheet.json)
                        }
                        for (const sheet of atlases.atlas.low[k]) {
                            files.set(sheet.json.meta.image!, sheet.image);
                            nn.low.push(sheet.json)
                        }
                        files.set(`${dest_dir}/atlas-${k}-data.json`,JSON.stringify(nn))
                    }
                }
                await buildSheets();

                return () => {
                    server.middlewares.use((req, res, next) => {
                        if (req.originalUrl === undefined) return next();

                        const file = files.get(req.originalUrl.slice(1));
                        if (file === undefined) return next();
                        if(req.originalUrl.lastIndexOf(".json")!==-1){
                            res.writeHead(200, {
                                "Content-Type": `text/json`
                            });
                        }else{
                            res.writeHead(200, {
                                "Content-Type": `image/${compilerOpts.outputFormat}`
                            });
                        }

                        res.end(file);
                    });
                };
            },
            closeBundle: async() => {
                await watcher.close();
            },
            resolveId,
            load
        }
    ];
}
