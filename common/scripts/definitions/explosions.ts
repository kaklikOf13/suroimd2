import { Definitions,Definition } from "../engine/mod.ts"
import { BulletDef, tracers } from "common/scripts/definitions/utils.ts";

export type ExplosionDef={
    size:{
        min:number
        max:number
    }
    tint:string
    damage:number
    bullet?:{
        def:BulletDef
        count:number
    }
    projectiles?:{
        def:string
        count:number
        speed:number
        angSpeed:number
        randomAng:number
    }
}&Definition
export const Explosions=new Definitions<ExplosionDef,null>((_v)=>{})
Explosions.insert(
    {
        idString:"barrel_explosion",
        tint:"#fff",
        size:{
            min:0.5,
            max:0.7
        },
        damage:80,
        bullet:{
            def:{
                damage:7,
                radius:0.0125,
                speed:20,
                range:10,
                tracer:tracers.tiny
            },
            count:5
        }
    },
    {
        idString:"frag_grenade_explosion",
        tint:"#355",
        size:{
            min:0.5,
            max:0.6
        },
        damage:110,
        bullet:{
            def:{
                damage:7,
                radius:0.0125,
                speed:18,
                range:8,
                tracer:tracers.tiny
            },
            count:5
        }
    },
    {
        idString:"mirv_grenade_explosion",
        tint:"#09e",
        size:{
            min:0.5,
            max:0.6
        },
        damage:110,
        bullet:{
            def:{
                damage:7,
                radius:0.0125,
                speed:18,
                range:8,
                tracer:tracers.mirv
            },
            count:5
        },
        projectiles:{
            count:6,
            def:"submirv_grenade",
            speed:1,
            angSpeed:9,
            randomAng:1
        }
    },
    {
        idString:"submirv_grenade_explosion",
        tint:"#09e",
        size:{
            min:0.1,
            max:0.2
        },
        damage:35,
        bullet:{
            def:{
                damage:7,
                radius:0.0125,
                speed:18,
                range:8,
                tracer:tracers.mirv
            },
            count:5
        },
    },
)