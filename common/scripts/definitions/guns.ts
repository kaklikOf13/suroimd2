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
export enum GunClasses{
    Shotgun,
    Sniper,
    Automatic,
    SMG
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
    class:GunClasses
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
        lenght:0.7,
        size:4,
        ammoType:AmmoType["762mm"],
        ammoSpawnAmount:90,
        class:GunClasses.Automatic,
        bullet:{
            damage:10,
            radius:0.014,
            range:85,
            speed:21,
            tracer:tracers.medium
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
        idString:"vector",
        fireDelay:0.03,
        spread:1,
        lenght:0.68,
        size:4,
        ammoType:AmmoType["9mm"],
        ammoSpawnAmount:90,
        class:GunClasses.Automatic,
        bullet:{
            damage:4,
            radius:0.014,
            range:35,
            speed:21,
            tracer:tracers.medium
        },
        reload:{
            delay:1.7,
            capacity:33
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
        class:GunClasses.Sniper,
        bullet:{
            damage:44,
            radius:0.02,
            range:85,
            speed:32,
            tracer:tracers.large
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
        idString:"awp",
        fireDelay:1.3,
        spread:1.1,
        lenght:0.9,
        size:6,
        ammoType:AmmoType["762mm"],
        class:GunClasses.Sniper,
        bullet:{
            damage:50,
            radius:0.025,
            range:88,
            speed:35,
            tracer:tracers.xl,
            obstacleMult:1.5,
        },
        reload:{
            delay:3.3,
            capacity:10,
            shotsPerReload:10,
        },
        recoil:{
            duration:1.34,
            speed:0.4
        },
        speedMult:0.9,
    },
    {
        idString:"awms",
        fireDelay:1.3,
        spread:1.2,
        lenght:1,
        size:6,
        ammoType:AmmoType["308sub"],
        class:GunClasses.Sniper,
        bullet:{
            damage:70,
            radius:0.02,
            range:90,
            speed:33,
            obstacleMult:1.7,
            tracer:tracers.large
        },
        reload:{
            delay:5.5,
            capacity:5,
            shotsPerReload:5,
        },
        recoil:{
            duration:1.34,
            speed:0.1
        },
        speedMult:0.9,
    },
    {
        idString:"m870",
        fireDelay:1.2,
        spread:3,
        lenght:0.7,
        ammoType:AmmoType["12g"],
        bulletsCount:10,
        jitterRadius:0.25,
        size:4.3,
        fireMode:FireMode.Single,
        class:GunClasses.Shotgun,
        bullet:{
            damage:7,
            radius:0.014,
            speed:16,
            range:17,
            tracer:tracers.medium
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
        spread:3,
        lenght:0.6,
        ammoType:AmmoType["12g"],
        bulletsCount:10,
        jitterRadius:0.05,
        class:GunClasses.Shotgun,
        size:4.5,
        fireMode:FireMode.Single,
        bullet:{
            damage:6.3,
            radius:0.012,
            speed:19,
            range:35,
            tracer:tracers.small
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
    {
        idString:"hp18",
        fireDelay:0.2,
        spread:9,
        lenght:0.65,
        ammoType:AmmoType["12g"],
        bulletsCount:15,
        jitterRadius:0.15,
        class:GunClasses.Shotgun,
        size:3.8,
        fireMode:FireMode.Auto,
        bullet:{
            damage:1.4,
            radius:0.01,
            speed:15,
            range:18,
            tracer:tracers.tiny
        },
        reload:{
            delay:0.7,
            capacity:5,
            shotsPerReload:1,
        },
        recoil:{
            duration:0.5,
            speed:0.6
        },
        speedMult:0.98,
        gasParticles:GasParticles.shotgun
    },
)