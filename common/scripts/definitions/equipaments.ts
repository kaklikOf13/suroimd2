import { Definitions,Definition } from "../engine/mod.ts"

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
export const Armors=new Definitions<EquipamentDef>()
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