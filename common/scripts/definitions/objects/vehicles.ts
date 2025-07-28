import { Definition, Definitions } from "../../engine/definitions.ts";

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
        }
    },
)