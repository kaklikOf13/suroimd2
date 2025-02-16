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
            stream.writeFloat(data.radius,0,2,2)
            stream.writePosition(data.speed)
        }
    }
}