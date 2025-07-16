import { Definition, Definitions } from "../../engine/definitions.ts";
import { ItemQuality } from "../../others/item.ts";
import { GameItem, InventoryItemType } from "../utils.ts";

export interface BackpackDef extends Definition{
    ammos_max:Record<string,number>
    rarity:ItemQuality
    level:number
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
            "762mm":90,
            "556mm":90,
        },
        rarity:ItemQuality.Common,
    },
    
    {
        idString:"tactical_pack",
        level:3,
        ammos_max:{
            "12g":90,
            "9mm":400,
            "762mm":320,
            "556mm":320,
        },
        rarity:ItemQuality.Common,
    }
)