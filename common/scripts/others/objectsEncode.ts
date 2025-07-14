import { ObjectEncoder,EncodedData,Vec2, type NetStream } from "../engine/mod.ts";
export interface PlayerData extends EncodedData{
    full?:{
        name:string
        vest:number
        helmet:number
        handItem?:number
    }
    position:Vec2
    rotation:number
    using_item:boolean
    using_item_down:boolean
}

export interface LootData extends EncodedData{
    // deno-lint-ignore ban-types
    full?:{
    }
    position:Vec2
}

export interface BulletData extends EncodedData{
    // deno-lint-ignore ban-types
    full?:{}
    speed:number
    angle:number

    tracerWidth:number
    tracerHeight:number
    tracerColor:number

    radius:number
    position:Vec2
    initialPos:Vec2
    maxDistance:number
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
export const ObjectsE:Record<string,ObjectEncoder>={
    player:{
        decode:(full:boolean,stream:NetStream)=>{
            const ret:PlayerData={
                position:stream.readPosition(),
                rotation:stream.readRad(),
                using_item:false,
                using_item_down:false,
                full:undefined,
            }
            const bg1=stream.readBooleanGroup()
            ret.using_item=bg1[0]
            ret.using_item_down=bg1[1]
            if(full){
                //const bgf1=stream.readBooleanGroup()
                ret.full={
                    name:stream.readStringSized(28),
                    vest:stream.readUint8(),
                    helmet:stream.readUint8(),
                    //handItem:bgf1[0]?stream.readUint24():undefined
                }
            }
            return ret
        },
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        encode(full:boolean,data:PlayerData,stream:NetStream){
            stream.writePosition(data.position)
            .writeRad(data.rotation)
            .writeBooleanGroup(data.using_item,data.using_item_down)
            if(full){
                //stream.writeBooleanGroup(data.full!.handItem!==undefined)
                stream.writeStringSized(28,data.full!.name)
                .writeUint8(data.full!.vest)
                .writeUint8(data.full!.helmet)
                //if(data.full!.handItem)stream.writeUint24(data.full!.handItem)
                
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

                }
            }
            return ret
        },
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        encode(full:boolean,data:LootData,stream:NetStream){
            stream.writePosition(data.position)
            if(full){
                //
            }
        }
    },
    bullet:{
        decode:(full:boolean,stream:NetStream)=>{
            const ret:BulletData={
                position:stream.readPosition(),
                initialPos:stream.readPosition(),
                maxDistance:stream.readFloat32(),
                radius:stream.readFloat(0,2,2),
                speed:stream.readFloat32(),
                angle:stream.readRad(),
                tracerWidth:stream.readFloat(0,100,3),
                tracerHeight:stream.readFloat(0,6,2),
                tracerColor:stream.readUint32()
            }
            if(full){
                //
            }
            return ret
        },
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        encode(_full:boolean,data:BulletData,stream:NetStream){
            stream.writePosition(data.position)
            .writePosition(data.initialPos)
            .writeFloat32(data.maxDistance)
            .writeFloat(data.radius,0,2,2)
            .writeFloat32(data.speed)
            .writeRad(data.angle)
            .writeFloat(data.tracerWidth,0,100,3)
            .writeFloat(data.tracerHeight,0,6,2)
            .writeUint32(data.tracerColor)
        }
    },
    obstacle:{
        //19 Full Alloc
        decode:(full:boolean,stream:NetStream)=>{
            const bools=stream.readBooleanGroup()//1
            const ret:ObstacleData={
                scale:stream.readFloat(0,3,3),//3
                dead:bools[0],
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
}