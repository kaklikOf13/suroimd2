import { BoostType } from "common/scripts/definitions/player/boosts.ts";
import { type Player } from "../gameObjects/player.ts";
import { type GameItem } from "common/scripts/definitions/utils.ts";
import { type MeleeDef } from "common/scripts/definitions/items/melees.ts";
import { type GunDef } from "common/scripts/definitions/items/guns.ts";
import { type EquipamentDef } from "common/scripts/definitions/items/equipaments.ts";
import { Backpacks, type BackpackDef } from "common/scripts/definitions/items/backpacks.ts";

export interface InventoryGiftItem{
    item:GameItem,
    count:number
}
export interface InventoryGift{
    helmet?:(player:Player)=>EquipamentDef|undefined
    vest?:(player:Player)=>EquipamentDef|undefined
    backpack?:(player:Player)=>BackpackDef|undefined

    items?:(player:Player)=>InventoryGiftItem[]

    melee?:(player:Player)=>MeleeDef|undefined
    gun1?:(player:Player)=>GunDef|undefined
    gun2?:(player:Player)=>GunDef|undefined
}
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
        },
        respawn?:{
            max_respawn?:number
            keep_inventory?:boolean
            insert_inventory?:InventoryGift
        }
    }
}
export const DefaultGamemode:Gamemode={
    player:{
        boosts:{
            adrenaline:{
                decay:0.3,
                speed:0.2,
                regen:0.01
            },
            mana:{
                regen:0.03
            },
            addiction:{
                decay:0.25,
                damage:1,
                speed:0.8,
                abstinence:0.009
            },
            default_boost:BoostType.Adrenaline
        },
        /*respawn:{
            max_respawn:2,
            insert_inventory:{
                backpack(_player) {
                    return Backpacks.getFromString("basic_pack")
                },
            }
        }*/
    }
}