import { Definitions,Definition } from "../engine/mod.ts"
import { GameItem, InventoryItemType } from "common/scripts/definitions/utils.ts";

export interface OtherDef extends Definition{
    size:number
}
export const Others=new Definitions<OtherDef,GameItem>((i)=>{
    i.item_type=InventoryItemType.other
})
Others.insert(
    {
        idString:"cellphone",
        size:1
    },
)