import { Definitions,Definition } from "../engine/mod.ts"

export enum HealingCondition{
    UnfullHealth,
}
export interface HealingDef extends Definition{
    size:number
    health?:number
    use_delay:number
    condition?:HealingCondition[]
}
export const Healings=new Definitions<HealingDef>()
Healings.insert(
    {
        idString:"life_candy",
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
    }
)