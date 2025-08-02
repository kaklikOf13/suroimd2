import { v2 } from "../../engine/geometry.ts";
import { CircleHitbox2D,Hitbox2D,Definitions,Definition, RotationMode, Vec2 } from "../../engine/mod.ts";
import { zIndexes } from "../../others/constants.ts";
import { RectHitbox2D } from "../../engine/hitbox.ts";

export interface ObstacleDef extends Definition{
    health:number
    hitbox?:Hitbox2D
    spawnHitbox?:Hitbox2D
    hotspot?:Vec2
    noCollision?:boolean
    noBulletCollision?:boolean
    scale?:{
        min?:number
        max?:number
        destroy?:number
    }
    frame?:{
        base?:string
        dead?:string
        particle?:string
    }
    particle?:string
    variations?:number
    zIndex?:number
    rotationMode?:number

    onDestroyExplosion?:string
    material?:string

    lootTable?:string

    interactDestroy?:boolean
    reflectBullets?:boolean

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
        particle:"stone_particle"
    },
    {
        idString:"barrel",
        health:70,
        hitbox:new CircleHitbox2D(v2.new(0,0),0.57),
        scale:{
            destroy:0.68
        },
        rotationMode:RotationMode.full,
        zIndex:zIndexes.Obstacles1,
        onDestroyExplosion:"barrel_explosion",
        material:"metal",
        reflectBullets:true
    },
    {
        idString:"oak_tree",
        health:80,
        hitbox:new CircleHitbox2D(v2.new(0,0),0.2),
        scale:{
            destroy:0.9,
            max:2.5,
            min:2.3
        },
        rotationMode:RotationMode.full,
        zIndex:zIndexes.Obstacles4,
        material:"tree",
        frame:{
            particle:"oak_tree_particle"
        }
    },
    {
        idString:"wood_crate",
        health:70,
        hitbox:new RectHitbox2D(v2.new(0,0),v2.new(0.8,0.8)),
        scale:{
            destroy:1,
            min:1.6,
            max:2,
        },
        rotationMode:RotationMode.null,
        zIndex:zIndexes.Obstacles3,
        material:"tree",

        interactDestroy:true,
        lootTable:"wood_crate"
    },
    {
        idString:"copper_crate",
        health:160,
        hotspot:v2.new(0,0),
        hitbox:new RectHitbox2D(v2.new(0,0),v2.new(0.8,0.8)),
        scale:{
            destroy:0.8
        },
        rotationMode:RotationMode.null,
        zIndex:zIndexes.Obstacles3,
        material:"tree",
        reflectBullets:true,

        interactDestroy:true,
        lootTable:"copper_crate"
    },
    {
        idString:"iron_crate", //Airdrop
        health:170,
        hotspot:v2.new(0,0),
        hitbox:new RectHitbox2D(v2.new(0,0),v2.new(0.8,0.8)),
        scale:{
            destroy:0.8
        },
        rotationMode:RotationMode.null,
        zIndex:zIndexes.Obstacles3,
        material:"tree",
        reflectBullets:true,

        interactDestroy:true,
        lootTable:"iron_crate"
    },
    {
        idString:"gold_crate", //Gold Airdrop
        health:180,
        hotspot:v2.new(0,0),
        hitbox:new RectHitbox2D(v2.new(0,0),v2.new(0.8,0.8)),
        scale:{
            destroy:0.8
        },
        rotationMode:RotationMode.null,
        zIndex:zIndexes.Obstacles3,
        material:"tree",
        reflectBullets:true,

        interactDestroy:true,
        lootTable:"gold_crate"
    },
    {
        idString:"bush",
        health:70,
        hitbox:new CircleHitbox2D(v2.new(0,0),0.6),
        noCollision:true,
        scale:{
            destroy:1
        },
        particle:"leaf_green_particle",
        rotationMode:RotationMode.full,
        zIndex:zIndexes.Obstacles3,
        material:"bush",
        frame:{
            particle:"leaf_01_particle_1"
        }
    }
)