import { join } from "https://deno.land/std@0.204.0/path/mod.ts"
import { emptyDir } from "https://deno.land/std@0.204.0/fs/mod.ts"

console.log("🚀 Building Vite bundle...")

// Step 1 — Build Vite
const vite = new Deno.Command("deno", {
  args: ["task", "build"],
  stdout: "inherit",
  stderr: "inherit",
})
const viteResult = await vite.output()
if (!viteResult.success) {
  console.error("❌ Vite build failed")
  Deno.exit(1)
}

// Step 2 — Create a temporary package.json for electron-packager
const tmpPkg = {
  name: "suroimd2",
  version: "1.0.0",
  main: "electron/main.js",
  author: {
    name: "kaklik",
  },
  description: "A .io Game",
  type: "commonjs"
}

async function copyDir(src: string, dest: string) {
  await Deno.mkdir(dest, { recursive: true });

  for await (const entry of Deno.readDir(src)) {
    const srcPath = `${src}/${entry.name}`;
    const destPath = `${dest}/${entry.name}`;

    if (entry.isDirectory) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile) {
      await Deno.copyFile(srcPath, destPath);
    }
  }
}

const outDir = join(Deno.cwd(), "release")
await emptyDir(outDir)

Deno.mkdirSync(outDir+"/resources")
const pkgPath1 = join(Deno.cwd(), "package.json")
const pkgPath2 = join(Deno.cwd(), "release/resources/package.json")
await Deno.writeTextFile(pkgPath1, JSON.stringify(tmpPkg, null, 2))
await Deno.writeTextFile(pkgPath2, JSON.stringify(tmpPkg, null, 2))

await copyDir(join(Deno.cwd(),"dist"),"release/resources/main")
await copyDir(join(Deno.cwd(),"electron"),"release/resources/electron")

// Step 3 — Run electron-packager
console.log("⚡ Running electron-packager...")

const args = [
  "npx",
  "@electron/packager",
  "./release/resources",
  "suroimd2",
  "--platform=win32",
  "--arch=x64",
  "--out=release",
  "--overwrite",
  "--icon=dist/favicon.ico",
  "--app-version=1.0.0",
  "--prune=true",
  "--no-asar",
  "--ignore=node_modules",
  "--ignore=deno.lock",
  "--ignore=deno.json",
  "--ignore=package-lock.json",
  "--electron-version=31.3.0"
]

const command = Deno.build.os === "windows"
  ? new Deno.Command("cmd", { args: ["/c", ...args], stdout: "inherit", stderr: "inherit" })
  : new Deno.Command(args[0], { args: args.slice(1), stdout: "inherit", stderr: "inherit" })

const { code } = await command.output()

// Step 4 — Clean up temporary package.json
await Deno.remove(pkgPath1)

if (code === 0) {
  console.log("✅ Electron package created successfully!")
} else {
  console.error("❌ electron-packager failed.")
  Deno.exit(code)
}
