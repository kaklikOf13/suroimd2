import { type NetStream, Packet } from "../engine/mod.ts"
import { Floor } from "../others/terrain.ts";
export interface MapConfig{
    terrain:Floor[]
}
export class MapPacket extends Packet{
    ID=6
    Name="map"
    map:MapConfig={terrain:[]}
    constructor(){
        super()
    }
    encode(stream: NetStream): void {
        stream.writeArray(this.map.terrain,(t)=>{
            stream.writeUint8(t.type)
            stream.writeArray(t.vertex,(p)=>{
                stream.writePosition(p)
            },2)
        },2)
    }
    decode(stream: NetStream): void {
        this.map.terrain=stream.readArray(()=>{
            return {
                type:stream.readUint8(),
                vertex:stream.readArray(()=>{
                    return stream.readPosition()
                },2)
            }
        },2)
    }
}