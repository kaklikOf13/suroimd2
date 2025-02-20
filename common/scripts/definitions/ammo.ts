import { Definitions,Definition } from "../engine/mod.ts"

export enum AmmoType{
    "12g"=0,
    "762mm"
}
export interface AmmoDef extends Definition{
    size:number
    tint:string
    defaultTrail:string
    strongTrail:string
    ammoType:AmmoType
}
export const Ammos=new Definitions<AmmoDef>()
Ammos.insert(
    {
        idString:"12g",
        ammoType:AmmoType["12g"],
        defaultTrail:"#b38d8b",
        strongTrail:"#db2218",
        tint:"#f00",
        size:0.01,
    },
    {
        idString:"762mm",
        ammoType:AmmoType["762mm"],
        defaultTrail:"#0034f2",
        strongTrail:"#001caf",
        tint:"#00f",
        size:0.0029,
    }
)