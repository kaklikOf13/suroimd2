import { HostConfig } from "../engine/server_offline/offline_server.ts";

export interface GameConfig{
    maxPlayers:number
    gameTps:number
    teamSize:number
    netTps:number
    deenable_lobby:boolean
}
export interface RegionDef{
    host:string
    port:number
    ssh?:boolean
}
export interface ConfigType {
  api: {
    host: HostConfig;
    global:string
  };
  game: {
    max_games: number;
    config: GameConfig;
    host: HostConfig;
  };
  regions: Record<string, RegionDef>;
  database: {
    enabled: boolean;
    files: {
      accounts: string;
      forum: string;
    };
    api_key: string;
  };
  shop: {
    skins: Partial<Record<number, number>>;
  };
}