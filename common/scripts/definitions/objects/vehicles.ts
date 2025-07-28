import { Definition, Definitions } from "../../engine/definitions.ts";
import { v2, Vec2 } from "../../engine/geometry.ts";

export interface VehicleDef extends Definition{
    frame:{
        base?:string
        base_scale?:number
    }
    movimentation:{
        acceleration:number
        angle_acceleration:number
        final_speed:number
        desacceleration:number
    }
    pillot_seat:{
        position:Vec2
    }
    seats?:{
        position:Vec2
    }[]
}


export const Vehicles=new Definitions<VehicleDef,null>((g)=>{
})

Vehicles.insert(
    {
        idString:"bike",
        frame:{
            base_scale:2
        },
        movimentation:{
            acceleration:1000,
            angle_acceleration:4000,
            final_speed:15,
            desacceleration:1000
        },
        pillot_seat:{
            position:v2.new(0,0)
        }
    },
    {
        idString:"jeep",
        frame:{
            base_scale:4
        },
        movimentation:{
            acceleration:1000,
            angle_acceleration:4000,
            final_speed:9,
            desacceleration:1000
        },
        pillot_seat:{
            position:v2.new(0.3,-1)
        },
        seats:[
            {position:v2.new(0.3,1)}
        ]
    },
)