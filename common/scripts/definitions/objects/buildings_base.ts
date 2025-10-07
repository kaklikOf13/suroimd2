import { v2, Vec2 } from "../../engine/geometry.ts";
import { Definitions,Definition } from "../../engine/mod.ts"

export type BuildingObstacles={
    id:string
    position:Vec2
    rotation?:number
    scale?:number
}
export type BuildingSubBuilding={
    id:string
    position:Vec2
    rotation?:0|1|2|3
}
export interface BuildingDef extends Definition{
    obstacles:BuildingObstacles[]
}
export const Buildings=new Definitions<BuildingDef,null>((i)=>{
})
Buildings.insert(
    {
        idString:"public_bathroom",
        obstacles:[
            {
                id:"stone",
                position:v2.new(2,0),
                scale:1,
                rotation:0
            },
            {
                id:"oak_tree",
                position:v2.new(0,-2),
                scale:1,
                rotation:0
            }
        ]
    },
)