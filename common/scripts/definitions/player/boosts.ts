export enum BoostType{
    Null,
    Shield,
    Adrenaline,
    Mana,
    Addiction
}
export interface BoostDef{
    name:string
    type:BoostType
    color:string
}
export const Boosts={
    [BoostType.Null]:{
        name:"null",
        color:"#fff",
        type:BoostType.Null
    },
    [BoostType.Adrenaline]:{
        name:"adrenaline",
        color:"#ff0",
        type:BoostType.Adrenaline
    },
    [BoostType.Shield]:{
        name:"shield",
        color:"#08f",
        type:BoostType.Shield
    },
    [BoostType.Mana]:{
        name:"mana",
        color:"#92a",
        type:BoostType.Mana
    },
    [BoostType.Addiction]:{
        name:"addiction",
        color:"#e13",
        type:BoostType.Addiction
    }
} as Record<BoostType,BoostDef>