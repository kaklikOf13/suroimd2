import { ObjectEncoder,EncodedData,Vec2, type NetStream } from "../engine/mod.ts";
export interface PlayerData extends EncodedData{
    full?:{
        name:string
        vest:number
        helmet:number
    }
    position:Vec2
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
                full:undefined
            }
            if(full){
                ret.full={
                    name:stream.readString(),
                    vest:stream.readUint8(),
                    helmet:stream.readUint8()
                }
            }
            return ret
        },
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        encode(full:boolean,data:PlayerData,stream:NetStream){
            stream.writePosition(data.position)
            if(full){
                stream.writeString(data.full!.name)
                .writeUint8(data.full!.vest)
                .writeUint8(data.full!.helmet)
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
}