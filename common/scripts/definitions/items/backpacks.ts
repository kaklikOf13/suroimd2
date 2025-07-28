import { Definition, Definitions } from "../../engine/definitions.ts";
import { ItemQuality } from "../../others/item.ts";
import { GameItem, InventoryItemType } from "../utils.ts";

export interface BackpackDef extends Definition{
    max:Record<string,number>
    rarity:ItemQuality
    level:number
    no_world_image?:boolean
    slots:number
}


export const Backpacks=new Definitions<BackpackDef,GameItem>((g)=>{
    g.item_type=InventoryItemType.backpack
})

Backpacks.insert(
    {
        idString:"null_pack",
        level:0,
        max:{
            "12g":15,
            "9mm":120,
            "762mm":100,
            "556mm":100,
            "308sub":10,

            "gauze":5,
            "soda":2,
            "small_blue_potion":2,
            "small_purple_potion":2,
            "small_red_crystal":2,

            "inhaler":1,
            "blue_potion":1,
            "purple_potion":1,
            "red_crystal":1,

            "medikit":1,
            "blue_pills":1,
            "yellow_pills":1,
            "purple_pills":1,
            "red_pills":1,
        },
        rarity:ItemQuality.Common,
        no_world_image:true,
        slots:5,
    },
    {
        idString:"basic_pack",
        level:1,
        max:{
            "12g":30,
            "9mm":240,
            "762mm":190,
            "556mm":190,
            "308sub":20,

            "gauze":10,
            "soda":4,
            "small_blue_potion":3,
            "small_purple_potion":3,
            "small_red_crystal":3,

            "inhaler":2,
            "blue_potion":2,
            "purple_potion":2,
            "red_crystal":2,

            "medikit":2,
            "blue_pills":2,
            "yellow_pills":2,
            "purple_pills":2,
            "red_pills":2,
        },
        rarity:ItemQuality.Common,
        slots:6,
    },
    {
        idString:"regular_pack",
        level:2,
        max:{
            "12g":60,
            "9mm":320,
            "762mm":250,
            "556mm":250,
            "308sub":30,
            
            "gauze":15,
            "soda":8,
            "small_blue_potion":7,
            "small_purple_potion":7,
            "small_red_crystal":7,

            "inhaler":3,
            "blue_potion":3,
            "purple_potion":3,
            "red_crystal":3,

            "medikit":3,
            "blue_pills":3,
            "yellow_pills":3,
            "purple_pills":3,
            "red_pills":3,
        },
        rarity:ItemQuality.Common,
        slots:6,
    },
    {
        idString:"tactical_pack",
        level:3,
        max:{
            "12g":90,
            "9mm":400,
            "762mm":310,
            "556mm":310,
            "308sub":40,
            
            "gauze":30,
            "soda":16,
            "small_blue_potion":10,
            "small_purple_potion":10,
            "small_red_crystal":10,

            "inhaler":4,
            "blue_potion":4,
            "purple_potion":4,
            "red_crystal":4,

            "medikit":4,
            "blue_pills":4,
            "yellow_pills":4,
            "purple_pills":4,
            "red_pills":4,
        },
        rarity:ItemQuality.Common,
        slots:7,
    }
)