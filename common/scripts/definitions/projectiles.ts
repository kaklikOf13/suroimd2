import { Definitions,Definition } from "../engine/mod.ts"

export type ProjectileDef={
    size:number

    explosion?:string

    gravity:number
    radius:number
    zBaseScale:number
    zScaleAdd:number

    decays:{
        ground_speed:number
        ground_rotation:number
    }

    cook?:{
        allow_hand:boolean
        fuse_time:number
    }

    frames:{
        world:string
    }
}&Definition
export const Projectiles=new Definitions<ProjectileDef,null>((_v)=>{})
Projectiles.insert(
    {
        idString:"frag_grenade",
        gravity:0.6,
        radius:0.5,
        zBaseScale:0.5,
        zScaleAdd:0.6,
        decays:{
            ground_rotation:1,
            ground_speed:1
        },
        size:0.9,
        
        cook:{
            allow_hand:false,
            fuse_time:8
        },
        explosion:"frag_grenade_explosion",
        frames:{
            world:"proj_frag"
            
        }
    },
    //Mirv
    {
        idString:"mirv_grenade",
        gravity:0.6,
        radius:0.5,
        zBaseScale:0.5,
        zScaleAdd:0.6,
        decays:{
            ground_rotation:1,
            ground_speed:1
        },
        size:1.1,
        
        cook:{
            allow_hand:false,
            fuse_time:8
        },
        explosion:"mirv_grenade_explosion",
        frames:{
            world:"proj_mirv"
            
        }
    },
    {
        idString:"submirv_grenade",
        gravity:1.2,
        radius:0.5,
        zBaseScale:0.5,
        zScaleAdd:0.6,
        decays:{
            ground_rotation:3,
            ground_speed:3
        },
        size:0.3,
        
        cook:{
            allow_hand:false,
            fuse_time:2
        },
        explosion:"submirv_grenade_explosion",
        frames:{
            world:"proj_submirv"
        }
    }
)