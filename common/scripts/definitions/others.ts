import { Definitions,Definition } from "../engine/mod.ts"
import { ItemQuality } from "../others/item.ts";
import { GameItem, InventoryItemType } from "./utils.ts";

export interface OtherDef extends Definition{
    size:number
    quality:ItemQuality
}
export const Others=new Definitions<OtherDef,GameItem>((i)=>{
    i.item_type=InventoryItemType.other
})
Others.insert(
    {
        idString:"cellphone",
        size:1,
        quality:ItemQuality.Developer
    },
)