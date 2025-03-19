import { Definitions,Definition } from "../engine/mod.ts";
import { AmmoType } from "common/scripts/definitions/ammo.ts";
import { BulletDef, GameItem, InventoryItemType, tracers } from "./utils.ts";
export enum FireMode{
    Auto,
    Single
}
export interface GasParticle{
    count:number
}
export interface GunDef extends Definition{
    bullet:BulletDef
    ammoSpawnAmount?:number
    ammoSpawn?:string
    fireDelay:number
    bulletsCount?:number
    spread?:number
    lenght:number
    jitterRadius?:number
    fireMode?:FireMode
    speedMult?:number
    size:number
    ammoType:AmmoType
    reload:{
        capacity:number
        delay:number
        shotsPerReload?:number
    }
    recoil?:{
        duration:number
        speed:number
    }
    gasParticles?:GasParticle
}

export const Guns=new Definitions<GunDef,GameItem>((g)=>{
    g.item_type=InventoryItemType.gun
    g.count=1
})

export const GasParticles={
    shotgun:{
        count:5
    } satisfies GasParticle,
    automatic:{
        count:1
    } satisfies GasParticle
}

Guns.insert(
    {
        idString:"ak47",
        fireDelay:0.1,
        spread:5,
        lenght:0.8,
        size:4,
        ammoType:AmmoType["762mm"],
        ammoSpawnAmount:90,
        bullet:{
            damage:10,
            radius:0.02,
            range:150,
            speed:39,
            tracer:{
                width:1,
                height:0.4,
            }
        },
        reload:{
            delay:2,
            capacity:30
        },
        recoil:{
            duration:0.1,
            speed:0.7
        },
        speedMult:0.96,
        gasParticles:GasParticles.automatic
    },
    {
        idString:"kar98k",
        fireDelay:1.2,
        spread:1,
        lenght:0.8,
        size:4.5,
        ammoType:AmmoType["762mm"],
        bullet:{
            damage:54,
            radius:0.02,
            range:220,
            speed:44,
            tracer:{
                width:2,
                height:0.4,
            }
        },
        reload:{
            delay:0.9,
            capacity:5,
            shotsPerReload:1,
        },
        recoil:{
            duration:1.2,
            speed:0.2
        },
        speedMult:0.9,
    },
    {
        idString:"m870",
        fireDelay:1.2,
        spread:3,
        lenght:0.8,
        ammoType:AmmoType["12g"],
        bulletsCount:10,
        jitterRadius:0.3,
        size:4.3,
        fireMode:FireMode.Single,
        bullet:{
            damage:7,
            radius:0.0125,
            speed:19,
            range:20,
            tracer:tracers.tiny
        },
        reload:{
            delay:0.8,
            capacity:5,
            shotsPerReload:1,
        },
        recoil:{
            duration:1.5,
            speed:0.4
        },
        speedMult:0.94,
        gasParticles:GasParticles.shotgun
    },
    {
        idString:"spas12",
        fireDelay:0.9,
        spread:4,
        lenght:0.8,
        ammoType:AmmoType["12g"],
        bulletsCount:10,
        jitterRadius:0.05,
        size:4.5,
        fireMode:FireMode.Single,
        bullet:{
            damage:6,
            radius:0.0125,
            speed:20,
            range:75,
            tracer:tracers.tiny
        },
        reload:{
            delay:0.8,
            capacity:9,
            shotsPerReload:1,
        },
        recoil:{
            duration:1.2,
            speed:0.5
        },
        speedMult:0.95,
        gasParticles:GasParticles.shotgun
    },
)