import { LootTable, LootTableItemRet } from "../../engine/inventory.ts";
import { InventoryItemType } from "../utils.ts";
import { GameItem, GameItems } from "../alldefs.ts";
import { GunDef } from "../items/guns.ts";
import { FloorType, RiversDef } from "../../others/terrain.ts";
import { Random1 } from "../../engine/random.ts";
import { Vec2 } from "../../engine/geometry.ts";
import { type Layers } from "../../others/constants.ts";
import { SpawnMode } from "../objects/obstacles.ts";
import { NormalLobby, NormalMap } from "./normal.ts";

export interface Aditional{
    withammo:boolean
}
export function loot_table_get_item(item:string,count:number,_aditional:Aditional):LootTableItemRet<GameItem>[]{
    const itemD=GameItems.valueString[item]
    if(!itemD){
        console.error(item,"Not Founded")
    }
    if(itemD.item_type===InventoryItemType.gun){
        const ret:LootTableItemRet<GameItem>[]=[
            {
                item:itemD,
                count:count
            }
        ]
        if(itemD.ammoSpawnAmount){
            const ammo_def=GameItems.valueString[(itemD as unknown as GunDef).ammoSpawn??(itemD as unknown as GunDef).ammoType]
            ret.push({
                item:ammo_def,
                count:(itemD as unknown as GunDef).ammoSpawnAmount!
            })
        }
        return ret
    }else{
        return [
            {
                item:itemD,
                count:count
            }
        ]
    }
}
export interface IslandDef{
    size:Vec2
    terrain:{
        base:FloorType
        floors:{
            type:FloorType
            padding:number
            variation:number
            spacing:number
        }[]
        rivers?:{
            defs:RiversDef[]
            expansion?:number
            spawn_floor:number
            divisions:number
        }
    },
    ground_loot?:{table:string,count:Random1,layer?:Layers}[],
    spawn?:{id:string,count:Random1,layer?:Layers,spawn?:SpawnMode}[][],
}
export interface MapDef{
    loot_tables:Record<string,LootTable>
    default_floor?:FloorType
    generation:{
        island?:IslandDef
    }
}
//export const LootTables=new LootTablesManager<GameItem,Aditional>(get_item)

export const Maps:Record<string,MapDef>={
    normal:NormalMap,
    lobby:NormalLobby
}