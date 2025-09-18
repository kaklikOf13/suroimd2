import { Definition, Definitions } from "../../engine/definitions.ts";
import { ItemQuality } from "../../others/item.ts";
import { GameItem, InventoryItemType } from "../utils.ts";

export interface ScopeDef extends Definition{
    scope_view:number
    droppable:boolean
    quality:ItemQuality
}
export const Others=new Definitions<ScopeDef,GameItem>((i)=>{
    i.item_type=InventoryItemType.scope
})
Others.insert(
    {
        idString:"scope_1x",
        scope_view:0.78,
        droppable:false,
        quality:ItemQuality.Developer
    },
    {
        idString:"scope_2x",
        scope_view:0.63,
        droppable:true,
        quality:ItemQuality.Developer
    },
    {
        idString:"scope_4x",
        scope_view:0.53,
        droppable:true,
        quality:ItemQuality.Developer
    },
    {
        idString:"scope_8x",
        scope_view:0.35,
        droppable:true,
        quality:ItemQuality.Developer
    },
    {
        idString:"scope_16x",
        scope_view:0.27,
        droppable:true,
        quality:ItemQuality.Developer
    },
    {
        idString:"scope_32x",
        scope_view:0.14,
        droppable:true,
        quality:ItemQuality.Developer
    },
)