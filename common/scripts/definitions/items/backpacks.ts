import { Definition, Definitions } from "../../engine/definitions.ts";
import { ItemQuality } from "../../others/item.ts";
import { GameItem, InventoryItemType } from "../utils.ts";

export interface BackpackDef extends Definition{
    ammos_max:Record<string,number>
    rarity:ItemQuality
    level:number
    no_world_image?:boolean
}


export const Backpacks=new Definitions<BackpackDef,GameItem>((g)=>{
    g.item_type=InventoryItemType.backpack
})

Backpacks.insert(
    {
        idString:"null_pack",
        level:0,
        ammos_max:{
            "12g":15,
            "9mm":120,
            "762mm":100,
            "556mm":100,
            "308sub":10,
        },
        rarity:ItemQuality.Common,
        no_world_image:true
    },
    {
        idString:"basic_pack",
        level:0,
        ammos_max:{
            "12g":30,
            "9mm":240,
            "762mm":190,
            "556mm":190,
            "308sub":20,
        },
        rarity:ItemQuality.Common,
        no_world_image:true
    },
    {
        idString:"regular_pack",
        level:0,
        ammos_max:{
            "12g":60,
            "9mm":320,
            "762mm":250,
            "556mm":250,
            "308sub":30,
        },
        rarity:ItemQuality.Common,
        no_world_image:true
    },
    {
        idString:"tactical_pack",
        level:3,
        ammos_max:{
            "12g":90,
            "9mm":400,
            "762mm":310,
            "556mm":310,
            "308sub":40,
        },
        rarity:ItemQuality.Common,
    }
)