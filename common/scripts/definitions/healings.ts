import { Definitions,Definition } from "../engine/mod.ts"

export interface HealingDef extends Definition{
    size:number
    health?:number
    use_delay:number
}
export const Healings=new Definitions<HealingDef>()
Healings.insert(
    {
        idString:"gauze",
        size:0.09,
        health:15,
        use_delay:1
    }
)