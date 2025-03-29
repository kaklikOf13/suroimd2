import { Definitions,Definition } from "../engine/mod.ts"
import { BoostType, GameItem, InventoryItemType } from "./utils.ts";

export enum HealingCondition{
    UnfullHealth,
    UnfullExtra
}
export interface HealingDef extends Definition{
    size:number
    health?:number
    boost?:number
    boost_type?:BoostType
    use_delay:number
    condition?:HealingCondition[]
}
export const Healings=new Definitions<HealingDef,GameItem>((i)=>{
    i.item_type=InventoryItemType.healing
    i.count=1
})
Healings.insert(
    {
        idString:"lifecandy",
        size:0.02,
        health:3,
        use_delay:0.65,
        condition:[HealingCondition.UnfullHealth]
    },
    {
        idString:"gauze",
        size:0.09,
        health:15,
        use_delay:2,
        condition:[HealingCondition.UnfullHealth]
    },
    {
        idString:"medikit",
        size:0.9,
        health:100,
        use_delay:5.5,
        condition:[HealingCondition.UnfullHealth]
    },

    //Adrenaline
    {
        idString:"soda",
        size:0.3,
        boost:25,
        use_delay:2.5,
        boost_type:BoostType.Adrenaline,
        condition:[HealingCondition.UnfullExtra]
    },
    {
        idString:"inhaler",
        size:0.4,
        boost:50,
        use_delay:4.5,
        boost_type:BoostType.Adrenaline,
        condition:[HealingCondition.UnfullExtra]
    },
    {
        idString:"yellow_pills",
        size:0.7,
        boost:100,
        use_delay:4.5,
        boost_type:BoostType.Adrenaline,
        condition:[HealingCondition.UnfullExtra]
    },

    //Shield
    {
        idString:"small_blue_potion",
        size:0.3,
        boost:25,
        use_delay:2.5,
        boost_type:BoostType.Shield,
        condition:[HealingCondition.UnfullExtra]
    },
    {
        idString:"blue_potion",
        size:0.4,
        boost:50,
        use_delay:4.5,
        boost_type:BoostType.Shield,
        condition:[HealingCondition.UnfullExtra]
    },
    {
        idString:"blue_pills",
        size:0.7,
        boost:100,
        use_delay:4.5,
        boost_type:BoostType.Shield,
        condition:[HealingCondition.UnfullExtra]
    },
    //Mana
    {
        idString:"small_purple_potion",
        size:0.2,
        boost:15,
        use_delay:1.1,
        boost_type:BoostType.Mana,
        condition:[HealingCondition.UnfullExtra]
    },
    {
        idString:"purple_potion",
        size:0.5,
        boost:40,
        use_delay:2.4,
        boost_type:BoostType.Mana,
        condition:[HealingCondition.UnfullExtra]
    },
    {
        idString:"purple_pills",
        size:0.75,
        boost:100,
        use_delay:4.5,
        boost_type:BoostType.Mana,
        condition:[HealingCondition.UnfullExtra]
    },
    //Addiction
    {
        idString:"small_red_crystal",
        size:0.2,
        boost:25,
        use_delay:1.5,
        boost_type:BoostType.Addiction,
        condition:[HealingCondition.UnfullExtra]
    },
    {
        idString:"red_crystal",
        size:0.4,
        boost:50,
        use_delay:2.2,
        boost_type:BoostType.Addiction,
        condition:[HealingCondition.UnfullExtra]
    },
    {
        idString:"red_pills",
        size:0.7,
        boost:100,
        use_delay:4.5,
        boost_type:BoostType.Addiction,
        condition:[HealingCondition.UnfullExtra]
    },
)