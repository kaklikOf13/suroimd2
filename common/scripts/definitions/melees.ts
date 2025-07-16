import { Definitions,Definition } from "../engine/mod.ts";
import { FistRig, ItemQuality, WeaponRig } from "../others/item.ts";
import { GameItem, InventoryItemType } from "./utils.ts";
export interface MeleeDef extends Definition{
    quality:ItemQuality
    damage:number
    radius:number
    offset:number
    automatic?:boolean
    size:number
    attack_delay:number
    damage_delays:number[]

    switchDelay?:number
    speed_mod?:number
    arms?:FistRig
    image?:WeaponRig
}

export const Melees=new Definitions<MeleeDef,GameItem>((g)=>{
    g.item_type=InventoryItemType.melee
})
Melees.insert(
    {
        idString:"survival_knife",
        damage:18,
        offset:0.5,
        quality:ItemQuality.Common,
        radius:0.5,
        size:0,
        attack_delay:0.55,
        damage_delays:[0.1]
    },
    {
        idString:"axe",
        damage:35,
        offset:0.5,
        quality:ItemQuality.Uncommon,
        radius:0.6,
        size:2,
        attack_delay:0.8,
        damage_delays:[0.3]
    },
    {
        idString:"hammer",
        damage:60,
        offset:0.5,
        quality:ItemQuality.Rare,
        radius:0.6,
        size:2.5,
        attack_delay:1.2,
        damage_delays:[0.4]
    },
)