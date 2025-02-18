import { v2 } from "common/scripts/engine/geometry.ts";
import { CircleHitbox2D,Hitbox2D,Definitions,Definition } from "../engine/mod.ts";

export interface ObstacleDef extends Definition{
    health:number,
    hitbox?:Hitbox2D,
    noCollision?:boolean
    noBulletCollision?:boolean
    scale?:{
        min?:number,
        man?:number,
        destroy?:number,
    }
    frame?:{
        base:string,
    }
}

export const Obstacles=new Definitions<ObstacleDef>()
Obstacles.insert(
    {
        idString:"stone",
        health:200,
        hitbox:new CircleHitbox2D(v2.new(0,0),0.5),
        scale:{
            destroy:0.7
        }
    }
)