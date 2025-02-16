import { ObjectEncoder,EncodedData,Vec2, type NetStream } from "../engine/mod.ts";
export interface PlayerData extends EncodedData{
    full?:{
        name:string
    }
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
    }
}