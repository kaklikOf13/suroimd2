import { ObjectEncoder,EncodedData,Vec2, type NetStream } from "../engine/mod.ts";
export interface PlayerData extends EncodedData{
    full?:{
        name:string
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
    speed:Vec2
    radius:number
    position:Vec2
    initialPos:Vec2
    maxDistance:number
}
export interface ObstacleData extends EncodedData{
    full?:{
        position:Vec2
        definition:number
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
                    name:stream.readString()
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
                speed:stream.readPosition()
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
            .writePosition(data.speed)
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
                    position:stream.readPosition()
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
            }
        }
    },
}