import { Definition, Definitions, FrameDef } from "../../engine/definitions.ts";
import { v2, Vec2 } from "../../engine/geometry.ts";
import { CircleHitbox2D, Hitbox2D } from "../../engine/hitbox.ts";
export interface CreatureDef extends Definition{
    imortal?:boolean
    health:number
    hitbox:Hitbox2D
    lootTable?:string
    server_side:{
        update?:string
        update_parameters?:Record<string,any>
    }
    client_side:{
        update?:string
        update_parameters?:Record<string,any>
    }
    parts:{
        frame:FrameDef
        position:Vec2
    }[]
    frame:{
        main:FrameDef
    }
}
export const CreaturesAI={
    
}
export const Creatures=new Definitions<CreatureDef,null>((i)=>{
})

Creatures.insert(
    {
        idString:"pig",
        lootTable:"animal_medium",
        health:80,
        hitbox:new CircleHitbox2D(v2.new(0,0),0.4),
        parts:[],
        frame:{
            main:{
                image:"pig_1",
                scale:1.5
            },
        },
        client_side:{

        },    
        server_side:{
            update:"friendly_1",
            update_parameters:{
                speed:2.6,
                stop_time:2,
                walk_time:4,
                walk_time_extension:5,
                stop_time_extension:6,
            }
        }
    },
)