import { v2 } from "common/scripts/engine/geometry.ts";
import { CircleHitbox2D,Hitbox2D,Definitions,Definition, RotationMode } from "../engine/mod.ts";
import { zIndexes } from "common/scripts/others/constants.ts";

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
    variations?:number,
    zIndex?:number
    rotationMode?:number
}

export const Obstacles=new Definitions<ObstacleDef>()
Obstacles.insert(
    {
        idString:"stone",
        health:150,
        hitbox:new CircleHitbox2D(v2.new(0,0),0.3),
        scale:{
            destroy:0.7
        },
        rotationMode:RotationMode.full,
        zIndex:zIndexes.Obstacles1,
    },
    {
        idString:"oak_tree",
        health:80,
        hitbox:new CircleHitbox2D(v2.new(0,0),0.3),
        scale:{
            destroy:0.8
        },
        rotationMode:RotationMode.full,
        zIndex:zIndexes.Obstacles3,
    },
    {
        idString:"bush",
        health:100,
        hitbox:new CircleHitbox2D(v2.new(0,0),0.3),
        noCollision:true,
        scale:{
            destroy:1
        },
        rotationMode:RotationMode.full,
        zIndex:zIndexes.Obstacles2,
    }
)