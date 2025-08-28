import { v2 } from "../../engine/geometry.ts";
import { CircleHitbox2D,Hitbox2D,Definitions,Definition, RotationMode, Vec2, FrameTransform } from "../../engine/mod.ts";
import { zIndexes } from "../../others/constants.ts";
import { HitboxGroup2D, RectHitbox2D } from "../../engine/hitbox.ts";
import { FloorType } from "../../others/terrain.ts";
export enum  SpawnModeType{
    any,
    blacklist,
    whitelist
}
export type SpawnMode={
    type:SpawnModeType.any
}|{
    type:SpawnModeType.blacklist|SpawnModeType.whitelist
    list:FloorType[]
}

export const Spawn={
    any:{
        type:SpawnModeType.any,
    },
    grass:{
        type:SpawnModeType.whitelist,
        list:[FloorType.Grass]
    },
}
export interface ObstacleDef extends Definition{
    health:number
    hitbox?:Hitbox2D
    spawnHitbox?:Hitbox2D
    hotspot?:Vec2
    noCollision?:boolean
    noBulletCollision?:boolean
    invisibleOnMap?:boolean
    scale?:{
        min?:number
        max?:number
        destroy?:number
    }
    frame_transform?:FrameTransform
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

    spawnMode:SpawnMode

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
        hitbox:new CircleHitbox2D(v2.new(0,0),0.65),
        scale:{
            destroy:0.7
        },
        frame_transform:{
            scale:1.5
        },
        rotationMode:RotationMode.full,
        zIndex:zIndexes.Obstacles1,
        material:"stone",
        particle:"stone_particle",
        spawnMode:Spawn.grass
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
        reflectBullets:true,
        spawnMode:Spawn.grass
    },
    {
        idString:"oak_tree",
        health:80,
        hitbox:new CircleHitbox2D(v2.new(0,0),0.4),
        scale:{
            destroy:0.9,
            max:1.2,
            min:1
        },
        frame_transform:{
            scale:2
        },
        rotationMode:RotationMode.full,
        zIndex:zIndexes.Obstacles4,
        material:"tree",
        frame:{
            particle:"oak_tree_particle"
        },
        spawnMode:Spawn.grass
    },
    {
        idString:"wood_crate",
        health:70,
        hitbox:new RectHitbox2D(v2.new(-0.71,-0.71),v2.new(0.71,0.71)),
        scale:{
            destroy:0.6,
        },
        frame_transform:{
            hotspot:v2.new(0,0),
            scale:2
        },
        rotationMode:RotationMode.null,
        zIndex:zIndexes.Obstacles3,
        material:"tree",

        interactDestroy:true,
        lootTable:"wood_crate",
        spawnMode:Spawn.grass
    },
    {
        idString:"copper_crate",
        health:160,
        hitbox:new RectHitbox2D(v2.new(-0.65,-0.65),v2.new(0.65,0.65)),//new HitboxGroup2D(new RectHitbox2D(v2.new(-0.6,-0.6),v2.new(0.6,0.6))),//
        scale:{
            destroy:0.6,
        },
        frame_transform:{
            hotspot:v2.new(0,0),
            scale:2
        },
        rotationMode:RotationMode.null,
        zIndex:zIndexes.Obstacles3,
        material:"tree", //TODO Copper Material

        interactDestroy:true,
        lootTable:"copper_crate",
        spawnMode:Spawn.grass
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
        material:"tree",//TODO Iron Material
        reflectBullets:true,

        interactDestroy:true,
        lootTable:"iron_crate",
        spawnMode:Spawn.grass
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
        lootTable:"gold_crate",
        spawnMode:Spawn.grass
    },
    {
        idString:"bush",
        health:70,
        hitbox:new CircleHitbox2D(v2.new(0,0),0.6),
        noCollision:true,
        scale:{
            destroy:1
        },
        frame_transform:{
            scale:1
        },
        particle:"leaf_green_particle",
        rotationMode:RotationMode.full,
        zIndex:zIndexes.Obstacles3,
        material:"bush",
        frame:{
            particle:"leaf_01_particle_1"
        },
        spawnMode:Spawn.grass
    }
)