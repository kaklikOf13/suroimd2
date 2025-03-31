import { v2 } from "common/scripts/engine/geometry.ts";
import { CircleHitbox2D,Hitbox2D,Definitions,Definition, RotationMode, Vec2 } from "../engine/mod.ts";
import { zIndexes } from "common/scripts/others/constants.ts";
import { RectHitbox2D } from "common/scripts/engine/hitbox.ts";

export interface ObstacleDef extends Definition{
    health:number
    hitbox?:Hitbox2D
    spawnHitbox?:Hitbox2D
    hotspot?:Vec2
    noCollision?:boolean
    noBulletCollision?:boolean
    scale?:{
        min?:number
        man?:number
        destroy?:number
    }
    frame?:{
        base:string
    }
    variations?:number
    zIndex?:number
    rotationMode?:number

    onDestroyExplosion?:string
    material?:string

    lootTable?:string

    sounds?:{
        hit:string
        break:string
        hit_variations?:number
    }
}
export interface MaterialDef{
    sounds:string
    hit_variations?:number
}
export const Materials:Record<string,MaterialDef>={
    tree:{
        sounds:"tree",
        hit_variations:2
    },
    stone:{
        sounds:"stone",
        hit_variations:2
    },
    bush:{
        sounds:"bush",
        hit_variations:2
    },
    metal:{
        sounds:"metal",
        hit_variations:2
    }
}

export const Obstacles=new Definitions<ObstacleDef,null>((_v)=>{})
Obstacles.insert(
    {
        idString:"stone",
        health:150,
        hitbox:new CircleHitbox2D(v2.new(0,0),0.45),
        scale:{
            destroy:0.7
        },
        rotationMode:RotationMode.full,
        zIndex:zIndexes.Obstacles1,
        material:"stone",
    },
    {
        idString:"barrel",
        health:100,
        hitbox:new CircleHitbox2D(v2.new(0,0),0.45),
        scale:{
            destroy:0.68
        },
        rotationMode:RotationMode.full,
        zIndex:zIndexes.Obstacles1,
        onDestroyExplosion:"barrel_explosion",
        material:"metal",
    },
    {
        idString:"oak_tree",
        health:80,
        hitbox:new CircleHitbox2D(v2.new(0,0),0.4),
        scale:{
            destroy:0.8
        },
        rotationMode:RotationMode.full,
        zIndex:zIndexes.Obstacles3,
        material:"tree",
    },
    {
        idString:"normal_crate",
        health:80,
        hotspot:v2.new(0,0),
        hitbox:new RectHitbox2D(v2.new(0,0),v2.new(0.8,0.8)),
        scale:{
            destroy:0.8
        },
        rotationMode:RotationMode.null,
        zIndex:zIndexes.Obstacles3,
        material:"tree",

        lootTable:"normal_crate"
    },
    {
        idString:"bush",
        health:70,
        hitbox:new CircleHitbox2D(v2.new(0,0),0.42),
        noCollision:true,
        scale:{
            destroy:1
        },
        rotationMode:RotationMode.full,
        zIndex:zIndexes.Obstacles2,
        material:"bush",
    }
)