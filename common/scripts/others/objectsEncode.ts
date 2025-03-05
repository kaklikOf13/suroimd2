import { InventoryItemType } from "../definitions/utils.ts";
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
    tracer:{
        width:number
        height:number
    }
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
    scale:number
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
                const bgf1=stream.readBooleanGroup()
                ret.full={
                    name:stream.readString(),
                    vest:stream.readUint8(),
                    helmet:stream.readUint8(),
                    handItem:bgf1[0]?stream.readUint24():undefined
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
                stream.writeBooleanGroup(data.full!.handItem!==undefined)
                .writeString(data.full!.name)
                .writeUint8(data.full!.vest)
                .writeUint8(data.full!.helmet)
                if(data.full!.handItem)stream.writeUint24(data.full!.handItem)
                
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
                speed:stream.readFloat(0,2,2),
                angle:stream.readRad(),
                tracer:{
                    width:stream.readFloat(0,2,2),
                    height:stream.readFloat(0,2,2)
                }
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
            .writeFloat(data.speed,0,2,2)
            .writeRad(data.angle)
            .writeFloat(data.tracer.width,0,2,2)
            .writeFloat(data.tracer.height,0,2,2)
        }
    },
    obstacle:{
        decode:(full:boolean,stream:NetStream)=>{
            const ret:ObstacleData={
                scale:stream.readFloat(0,3,3),
                full:undefined
            }
            if(full){
                ret.full={
                    definition:stream.readUint24(),
                    position:stream.readPosition(),
                    rotation:stream.readRad(),
                    variation:stream.readUint8()+1,
                }
            }
            return ret
        },
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        encode(full:boolean,data:ObstacleData,stream:NetStream){
            stream.writeFloat(data.scale,0,3,3)
            if(full){
                stream.writeUint24(data.full!.definition)
                stream.writePosition(data.full!.position)
                stream.writeRad(data.full!.rotation)
                stream.writeUint8(data.full!.variation-1)
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
    }
}