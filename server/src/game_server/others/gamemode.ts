import { BoostType } from "common/scripts/definitions/utils.ts";

export interface Gamemode{
    player:{
        boosts:{
            adrenaline:{
                decay:number
                speed:number
                regen:number
            }
            mana:{
                regen:number
            }
            addiction:{
                decay:number
                damage:number
                abstinence:number
                speed:number
            }
            default_boost:BoostType
        }
    }
}
export const DefaultGamemode:Gamemode={
    player:{
        boosts:{
            adrenaline:{
                decay:0.35,
                speed:0.5,
                regen:0.0112
            },
            mana:{
                regen:0.03
            },
            addiction:{
                decay:0.3,
                damage:1,
                speed:1,
                abstinence:0.009
            },
            default_boost:BoostType.Adrenaline
        },
    }
}