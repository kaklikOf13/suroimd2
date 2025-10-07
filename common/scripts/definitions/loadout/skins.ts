import { Definition, Definitions } from "../../engine/definitions.ts";
import { ItemQuality } from "../../others/item.ts";
import { GameItem, InventoryItemType } from "../utils.ts";

export interface SkinDef extends Definition{
    frame?:{
        base?:string
        base_tint?:number
        arm?:string
        arm_tint?:string
        mount?:{
            normal:string
            closed:string
        }
    }
    animation?:{
        frames:{delay:number,image:string}[]
        no?:boolean
        no_auto_talk:boolean
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
        idString:"nick_winner",
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
    {
        idString:"justin_winner",
        frame:{
            mount:{
                closed:"player_mounth_1_2",
                normal:"player_mounth_2_1"
            }
        },
        rarity:ItemQuality.Uncommon,
    },
)