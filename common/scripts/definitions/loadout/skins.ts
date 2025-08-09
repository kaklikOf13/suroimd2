import { Definition, Definitions } from "../../engine/definitions.ts";
import { ItemQuality } from "../../others/item.ts";
import { GameItem, InventoryItemType } from "../utils.ts";

export interface SkinDef extends Definition{
    frame?:{
        base?:string
        base_tint?:number
        arm?:string
        arm_tint?:string
    }
    animation?:{
        frames:{delay:number,image:string}[]
        no?:boolean
    }
    rarity:ItemQuality,
}


export const Skins=new Definitions<SkinDef,GameItem>((g)=>{
    g.item_type=InventoryItemType.skin
})

Skins.insert(
    {
        idString:"default_skin",
        rarity:ItemQuality.Common,
    },
    {
        idString:"widower",
        rarity:ItemQuality.Rare,
    },
    {
        idString:"kaklik",
        rarity:ItemQuality.Legendary,
    },
    {
        idString:"kitty",
        rarity:ItemQuality.Mythic,
    },
)