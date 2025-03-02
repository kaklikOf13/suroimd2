import { Definitions,Definition } from "../engine/mod.ts"
import { BulletDef, tracers } from "common/scripts/definitions/utils.ts";

export type ExplosionDef={
    size:{
        min:number
        max:number
    }
    tint:string

    bullet?:{
        def:BulletDef,
        count:number
    }
}&Definition
export const Explosions=new Definitions<ExplosionDef>()
Explosions.insert(
    {
        idString:"barrel_explosion",
        tint:"#fff",
        size:{
            min:0.5,
            max:0.7
        },
        bullet:{
            def:{
                damage:7,
                radius:0.2,
                speed:0.3,
                range:26,
                tracer:tracers.redTiny
            },
            count:5
        }
    },
)