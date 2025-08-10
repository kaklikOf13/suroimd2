import { RegionDef } from "common/scripts/definitions/utils.ts";
import { GameConfig } from "../src/game_server/others/game.ts";
import { HostConfig } from "../src/engine/websockets.ts";

export function loadConfigDeno(path: string): ConfigType {
  const jsonText = Deno.readTextFileSync(path);
  const parsed = JSON.parse(jsonText);
  parsed.shop.skins = Object.fromEntries(
    Object.entries(parsed.shop.skins).map(([k, v]) => [Number(k), v])
  );
  return parsed;
}

export async function loadConfigFetch(url: string): Promise<ConfigType> {
  const res = await fetch(url);
  const parsed = await res.json();
  parsed.shop.skins = Object.fromEntries(
    Object.entries(parsed.shop.skins).map(([k, v]) => [Number(k), v])
  );
  return parsed;
}
