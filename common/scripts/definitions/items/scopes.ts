import { Definition, Definitions } from "../../engine/definitions.ts";
import { ItemQuality } from "../../others/item.ts";
import { InventoryItemType } from "../utils.ts";

export interface ScopeDef extends Definition{
    scope_view:number
    droppable:boolean
    quality:ItemQuality
    item_type?:InventoryItemType.scope
}
export const Scopes=new Definitions<ScopeDef,{}>((i)=>{
    i.item_type=InventoryItemType.scope
})
Scopes.insert(
    {
        idString:"scope_1x",
        scope_view:0.78,
        droppable:false,
        quality:ItemQuality.Common
    },
    {
        idString:"scope_2x",
        scope_view:0.63,
        droppable:true,
        quality:ItemQuality.Common
    },
    {
        idString:"scope_4x",
        scope_view:0.53,
        droppable:true,
        quality:ItemQuality.Uncommon
    },
    {
        idString:"scope_8x",
        scope_view:0.35,
        droppable:true,
        quality:ItemQuality.Rare
    },
    {
        idString:"scope_16x",
        scope_view:0.27,
        droppable:true,
        quality:ItemQuality.Epic
    },
    {
        idString:"scope_32x",
        scope_view:0.14,
        droppable:true,
        quality:ItemQuality.Mythic
    },
)