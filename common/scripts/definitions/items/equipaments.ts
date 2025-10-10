import { Definitions,Definition, Vec2 } from "../../engine/mod.ts"
import { GameItem } from "../utils.ts";
import { InventoryItemType } from "../utils.ts";
import { PlayerModifiers } from "../../others/constants.ts";
import { v2 } from "common/scripts/engine/geometry.ts";
import { ItemQuality } from "../../others/item.ts";

export interface VestDef extends Definition{
    defence:number
    reduction:number
    level:number
    tint:number
}
export interface HelmetDef extends Definition{
    defence:number
    reduction:number
    level:number
    position?:Vec2
}
export const Vests=new Definitions<VestDef,GameItem>((obj)=>{
    obj.item_type=InventoryItemType.vest
    obj.quality=ItemQuality.Common
})

export const Helmets=new Definitions<HelmetDef,GameItem>((obj)=>{
    obj.item_type=InventoryItemType.helmet
    obj.quality=ItemQuality.Common
})
Helmets.insert(
    {
        idString:"basic_helmet",
        defence:0,
        level:1,
        reduction:0.1,
        position:v2.new(0,0)
    },
    {
        idString:"regular_helmet",
        defence:0,
        level:2,
        reduction:0.15,
        position:v2.new(0,0)
    },
    {
        idString:"tactical_helmet",
        defence:0,
        level:3,
        reduction:0.20,
        position:v2.new(0,0)
    },
)
Vests.insert(
    //Normals Vest
    {
        idString:"basic_vest",
        defence:0,
        level:1,
        reduction:0.1,
        tint:0xffffff
    },
    {
        idString:"regular_vest",
        defence:0,
        level:2,
        reduction:0.15,
        tint:0x556655
    },
    {
        idString:"tactical_vest",
        defence:0,
        level:3,
        reduction:0.20,
        tint:0x010011
    },
)
export interface AccessorieDef extends Definition{
    size:number
    modifiers:Partial<PlayerModifiers>
}
export const Accessories=new Definitions<AccessorieDef,GameItem>((obj)=>{
    obj.item_type=InventoryItemType.accessorie
    obj.quality=ItemQuality.Common
})
Accessories.insert(
    {
        idString:"rubber_bracelet",
        size:1,
        modifiers:{
            bullet_size:1.8,
        }
    },
    {
        idString:"bullet_wind",
        size:1,
        modifiers:{
            bullet_speed:1.7,
        }
    },
    {
        idString:"cobalt_bracelet",
        size:1,
        modifiers:{
            health:0.9,
            boost:1.1
        }
    },
    {
        idString:"uranium_bracelet",
        size:1,
        modifiers:{
            health:0.85,
            damage:1.2
        }
    },
)