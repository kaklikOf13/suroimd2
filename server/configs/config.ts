import { RegionDef } from "common/scripts/definitions/utils.ts";
import { GameConfig } from "../src/game_server/others/game.ts";
import { HostConfig } from "../src/engine/websockets.ts";

export const Config:ConfigType={
    api:{
        host:{
            port:8000,
        },
    },
    game:{
        max_games:5,
        config:{
            deenable_feast:true,
            gameTps:100,
            maxPlayers:10,
            netTps:60,
            teamSize:1
        },
        host:{
            port:8080
        }
    },
    regions:{
        local:{
            host:"localhost",
            port:8080
        },
    },
    database:{
        enabled:true
    }
}
export interface ConfigType{
    api:{
        host:HostConfig
    }
    game:{
        max_games:number
        config:GameConfig
        host:HostConfig
    }
    regions:Record<string,RegionDef>
    database:{
        enabled:boolean
    }
}