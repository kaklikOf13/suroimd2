import { v2, Vec2 } from "../engine/geometry.ts";
import { type NetStream, Packet } from "../engine/mod.ts"
import { Floor } from "../others/terrain.ts";
export interface MapConfig{
    terrain:Floor[]
    size:Vec2
}
export class MapPacket extends Packet{
    ID=6
    Name="map"
    map:MapConfig={terrain:[],size:v2.new(0,0)}
    constructor(){
        super()
    }
    encode(stream: NetStream): void {
        stream.writeArray(this.map.terrain,(t)=>{
            stream.writeBooleanGroup(t.smooth)
            .writeUint8(t.type)
            .writeArray(t.vertex,(p)=>{
                stream.writePosition(p)
            },2)
        },2)
        .writeUint16(this.map.size.x)
        .writeUint16(this.map.size.y)
    }
    decode(stream: NetStream): void {
        this.map.terrain=stream.readArray(()=>{
            const bg=stream.readBooleanGroup()
            return {
                type:stream.readUint8(),
                smooth:bg[0],
                vertex:stream.readArray(()=>{
                    return stream.readPosition()
                },2)
            }
        },2)
        this.map.size=v2.new(stream.readUint16(),stream.readUint16())
    }
}