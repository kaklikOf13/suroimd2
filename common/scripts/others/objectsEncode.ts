import { ObjectEncoder,EncodedData,Vec2, type NetStream } from "../engine/mod.ts";
export enum PlayerAnimationType{
    Shooting,
    Reloading,
    Healing,
}
export type PlayerAnimation={
}&({
    type:PlayerAnimationType.Shooting
}|{
    type:PlayerAnimationType.Reloading
    alt_reload:boolean
}|{
    type:PlayerAnimationType.Healing
    item:number
})
export interface PlayerData extends EncodedData{
    full?:{
        skin:number
        vest:number
        helmet:number
        backpack:number
        current_weapon:number
        animation?:PlayerAnimation
    }
    position:Vec2
    rotation:number
    using_item:boolean
    using_item_down:boolean
    dead:boolean
    left_handed:boolean
    parachute?:{
        value:number
    }
}

export interface LootData extends EncodedData{
    full?:{
        item:number
    }
    position:Vec2
}

export interface BulletData extends EncodedData{
    full?:{
        speed:number
        angle:number

        tracerWidth:number
        tracerHeight:number
        tracerColor:number

        projWidth:number
        projHeight:number
        projColor:number
        projIMG:number

        radius:number
        initialPos:Vec2
        maxDistance:number
    }
    tticks:number
    position:Vec2
}
export interface ExplosionData extends EncodedData{
    // deno-lint-ignore ban-types
    full?:{}
    position:Vec2
    def:number
    radius:number
}
export interface ObstacleData extends EncodedData{
    full?:{
        position:Vec2
        definition:number
        rotation:number
        variation:number
    }
    dead:boolean
    health:number
    scale:number
}
export interface ProjectileData extends EncodedData{
    full?:{
        definition:number
    }
    z:number
    position:Vec2
    rotation:number
}
export interface PlayerBodyData extends EncodedData{
    full?:{
        name:string
    }
    position:Vec2
}
export interface VehicleData extends EncodedData{
    full?:{
        dead:boolean
        def:number
    }
    rotation:number
    position:Vec2
}
export const ObjectsE:Record<string,ObjectEncoder>={
    player:{
        decode:(full:boolean,stream:NetStream)=>{
            const ret:PlayerData={
                position:stream.readPosition(),
                rotation:stream.readRad(),
                using_item:false,
                using_item_down:false,
                full:undefined,
                dead:false,
                left_handed:false
            }
            const bg1=stream.readBooleanGroup()
            ret.using_item=bg1[0]
            ret.using_item_down=bg1[1]
            ret.dead=bg1[3]
            ret.left_handed=bg1[4]
            if(bg1[5]){
                ret.parachute={
                    value:stream.readFloat(0,1,1)
                }
            }
            if(full){
                ret.full={
                    vest:stream.readUint8(),
                    helmet:stream.readUint8(),
                    backpack:stream.readUint8(),
                    skin:stream.readUint16(),
                    current_weapon:stream.readInt16(),
                }
                if(bg1[2]){
                    const tp=stream.readUint8() as PlayerAnimationType
                    switch(tp){
                        case PlayerAnimationType.Shooting:
                            ret.full.animation={
                                type:tp
                            }
                            break
                        case PlayerAnimationType.Reloading:
                            ret.full.animation={
                                type:tp,
                                alt_reload:!!stream.readUint8()
                            }
                            break
                        case PlayerAnimationType.Healing:
                            break
                    }
                }
            }
            return ret
        },
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        encode(full:boolean,data:PlayerData,stream:NetStream){
            stream.writePosition(data.position)
            .writeRad(data.rotation)
            .writeBooleanGroup(data.using_item,data.using_item_down,data.full?.animation!==undefined,data.dead,data.left_handed,data.parachute!==undefined)
            if(data.parachute){
                stream.writeFloat(data.parachute.value,0,1,1)
            }
            if(full){
                stream.writeUint8(data.full!.vest)
                .writeUint8(data.full!.helmet)
                .writeUint8(data.full!.backpack)
                .writeUint16(data.full!.skin)
                .writeInt16(data.full!.current_weapon)
                if(data.full!.animation!==undefined){
                    stream.writeUint8(data.full!.animation.type)
                    switch(data.full!.animation.type){
                        case PlayerAnimationType.Shooting:
                            break
                        case PlayerAnimationType.Reloading:
                            stream.writeUint8(data.full!.animation.alt_reload?1:0)
                            break
                        case PlayerAnimationType.Healing:
                            break
                    }
                }
            }
        }
    },
    loot:{
        decode:(full:boolean,stream:NetStream)=>{
            const ret:LootData={
                position:stream.readPosition(),
                full:undefined
            }
            if(full){
                ret.full={
                    item:stream.readUint16()
                }
            }
            return ret
        },
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        encode(full:boolean,data:LootData,stream:NetStream){
            stream.writePosition(data.position)
            if(full){
                stream.writeUint16(data.full!.item)
            }
        }
    },
    bullet:{
        decode:(full:boolean,stream:NetStream)=>{
            const ret:BulletData={
                position:stream.readPosition(),
                tticks:stream.readFloat(0,60,2)
            }
            if(full){
                ret.full={
                    initialPos:stream.readPosition(),
                    maxDistance:stream.readFloat32(),
                    radius:stream.readFloat(0,2,2),
                    speed:stream.readFloat32(),
                    angle:stream.readRad(),
                    tracerWidth:stream.readFloat(0,100,3),
                    tracerHeight:stream.readFloat(0,6,2),
                    tracerColor:stream.readUint32(),
                    projWidth:stream.readFloat(0,6,2),
                    projHeight:stream.readFloat(0,6,2),
                    projColor:stream.readUint32(),
                    projIMG:stream.readUint8()
                }
            }
            return ret
        },
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        encode(full:boolean,data:BulletData,stream:NetStream){
            stream.writePosition(data.position)
            .writeFloat(data.tticks,0,100,2)
            if(full){
                stream.writePosition(data.full!.initialPos)
                .writeFloat32(data.full!.maxDistance)
                .writeFloat(data.full!.radius,0,2,2)
                .writeFloat32(data.full!.speed)
                .writeRad(data.full!.angle)
                .writeFloat(data.full!.tracerWidth,0,100,3)
                .writeFloat(data.full!.tracerHeight,0,6,2)
                .writeUint32(data.full!.tracerColor)
                .writeFloat(data.full!.projWidth,0,6,2)
                .writeFloat(data.full!.projHeight,0,6,2)
                .writeUint32(data.full!.projColor)
                .writeUint8(data.full!.projIMG)
            }
        }
    },
    obstacle:{
        //19 Full Alloc
        decode:(full:boolean,stream:NetStream)=>{
            const bools=stream.readBooleanGroup()//1
            const ret:ObstacleData={
                scale:stream.readFloat(0,3,3),//3
                dead:bools[0],
                health:stream.readFloat(0,1,1),
                full:undefined
            }
            if(full){
                ret.full={
                    definition:stream.readUint24(),//3
                    position:stream.readPosition(),//8
                    rotation:stream.readRad(),//3
                    variation:stream.readUint8()+1,//1
                }
            }
            return ret
        },
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        encode(full:boolean,data:ObstacleData,stream:NetStream){
            stream.writeBooleanGroup(data.dead)
            .writeFloat(data.scale,0,3,3)
            .writeFloat(data.health,0,1,1)
            if(full){
                stream.writeUint24(data.full!.definition)
                .writePosition(data.full!.position)
                .writeRad(data.full!.rotation)
                .writeUint8(data.full!.variation-1)
            }
        }
    },
    explosion:{
        decode:(full:boolean,stream:NetStream)=>{
            const ret:ExplosionData={
                position:stream.readPosition(),
                def:stream.readID(),
                radius:stream.readFloat(0,20,3)
            }
            if(full){
                //
            }
            return ret
        },
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        encode(_full:boolean,data:ExplosionData,stream:NetStream){
            stream.writePosition(data.position)
            .writeID(data.def)
            .writeFloat(data.radius,0,20,3)
        }
    },
    projectile:{
        decode:(full:boolean,stream:NetStream)=>{
            const ret:ProjectileData={
                position:stream.readPosition(),
                rotation:stream.readRad(),
                z:stream.readFloat(0,1,1),
            }
            if(full){
                ret.full={
                    definition:stream.readID()
                }
            }
            return ret
        },
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        encode(full:boolean,data:ProjectileData,stream:NetStream){
            stream.writePosition(data.position)
            .writeRad(data.rotation)
            .writeFloat(data.z,0,1,1)
            if(full){
                stream.writeID(data.full!.definition)
            }
        }
    },
    player_body:{
        decode:(full:boolean,stream:NetStream)=>{
            const ret:PlayerBodyData={
                position:stream.readPosition(),
            }
            if(full){
                ret.full={
                    name:stream.readStringSized(30)
                }
            }
            return ret
        },
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        encode(full:boolean,data:PlayerBodyData,stream:NetStream){
            stream.writePosition(data.position)
            if(full){
                stream.writeStringSized(30,data.full!.name)
            }
        }
    },
    vehicle:{
        decode:(full:boolean,stream:NetStream)=>{
            const ret:VehicleData={
                position:stream.readPosition(),
                rotation:stream.readRad()
            }
            if(full){
                const bg=stream.readBooleanGroup()
                ret.full={
                    dead:bg[0],
                    def:stream.readUint8()
                }
            }
            return ret
        },
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        encode(full:boolean,data:VehicleData,stream:NetStream){
            stream.writePosition(data.position) 
            stream.writeRad(data.rotation)
            if(full){
                stream.writeBooleanGroup(data.full!.dead)
                stream.writeUint8(data.full!.def)
            }
        }
    }
}