import { v2, Vec2 } from "../engine/geometry.ts";
import { type NetStream, Packet } from "../engine/mod.ts"
import { Floor } from "../others/terrain.ts";
export interface MapObjectObstacle{
    type:0,
    def:number
    rotation:number
    variation:number
    position:Vec2
    scale:number
}
export type MapObjectEncode=MapObjectObstacle
export interface MapConfig{
    terrain:Floor[]
    size:Vec2
    seed:number
    objects:MapObjectEncode[]
}
export class MapPacket extends Packet{
    ID=6
    Name="map"
    map:MapConfig={terrain:[],size:v2.new(0,0),objects:[],seed:0}
    constructor(){
        super()
    }
    encode(stream: NetStream): void {
        stream.writeArray(this.map.terrain,(t)=>{
            stream.writeBooleanGroup(t.smooth,t.jagged)
            .writeHitbox(t.final_hb)
            stream.writeUint8(t.type)
            .writeInt8(t.layer)
        },2)
        .writeArray(this.map.objects,(i)=>{
            stream.writeUint8(i.type)
            switch(i.type){
                case 0:
                    stream.writeID(i.def)
                    .writeRad(i.rotation)
                    .writeUint8(i.variation)
                    .writePosition(i.position)
                    .writeFloat(i.scale,0.1,2,1)
            }
        },2)
        .writeUint32(this.map.seed)
        .writeUint16(this.map.size.x)
        .writeUint16(this.map.size.y)
    }
    decode(stream: NetStream): void {
        this.map.terrain=stream.readArray(()=>{
            const bg=stream.readBooleanGroup()
            const fhb=stream.readHitbox()
            return {
                type:stream.readUint8(),
                smooth:bg[0],
                jagged:bg[1],
                layer:stream.readInt8(),
                final_hb:fhb,
                hb:fhb
            }
        },2)
        this.map.objects=stream.readArray(()=>{
            const tp=stream.readUint8()
            switch(tp){
                default:
                    return {
                        type:0,
                        def:stream.readID(),
                        rotation:stream.readRad(),
                        variation:stream.readUint8(),
                        position:stream.readPosition(),
                        scale:stream.readFloat(0.1,2,1)
                    }
            }
        },2)
        this.map.seed=stream.readUint32()
        this.map.size=v2.new(stream.readUint16(),stream.readUint16())
    }
}