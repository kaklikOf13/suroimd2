import { Definitions,Definition } from "../engine/mod.ts"
import { GameItem } from "common/scripts/definitions/utils.ts";
import { InventoryItemType } from "common/scripts/definitions/utils.ts";
import { PlayerModifiers } from "common/scripts/others/constants.ts";

export enum EquipamentType{
    Helmet,
    Vest,
}
export interface EquipamentDef extends Definition{
    size:number
    defence:number
    reduction:number
    level:number
    type:EquipamentType
}
export const Armors=new Definitions<EquipamentDef,GameItem>((obj)=>{
    obj.item_type=InventoryItemType.equipament
    obj.count=1
})
Armors.insert(
    //Normals Vest
    {
        idString:"basic_vest",
        defence:0,
        level:1,
        reduction:0.1,
        size:1,
        type:EquipamentType.Vest,
    },
    {
        idString:"basic_helmet",
        defence:0,
        level:1,
        reduction:0.1,
        size:1,
        type:EquipamentType.Helmet,
    },
    {
        idString:"regular_vest",
        defence:0,
        level:2,
        reduction:0.15,
        size:1.3,
        type:EquipamentType.Vest,
    },
    {
        idString:"regular_helmet",
        defence:0,
        level:2,
        reduction:0.15,
        size:1,
        type:EquipamentType.Helmet,
    },
    {
        idString:"soldier_vest",
        defence:0,
        level:3,
        reduction:0.2,
        size:1.7,
        type:EquipamentType.Vest,
    },
    {
        idString:"soldier_helmet",
        defence:0,
        level:3,
        reduction:0.2,
        size:1.7,
        type:EquipamentType.Helmet,
    },
    {
        idString:"warrior_vest",
        defence:3,
        level:3,
        reduction:0,
        size:1.7,
        type:EquipamentType.Vest,
    },
    {
        idString:"warrior_helmet",
        defence:1,
        level:3,
        reduction:0,
        size:1.7,
        type:EquipamentType.Helmet,
    },
)
export interface AccessorieDef extends Definition{
    size:number
    modifiers:Partial<PlayerModifiers>
}
export const Accessories=new Definitions<AccessorieDef,GameItem>((obj)=>{
    obj.item_type=InventoryItemType.accessorie
    obj.count=1
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