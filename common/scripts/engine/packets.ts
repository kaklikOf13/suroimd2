import { NetStream } from "./stream.ts"
import { ID } from "./utils.ts"

export type PacketID=number

export abstract class Packet{
    abstract ID:PacketID // Identifier
    abstract Name:string //Name In Signal
    _size:number=0
    abstract encode(stream:NetStream):void
    abstract decode(stream:NetStream):void
    toString():string{return `{ID:${this.ID}}`}
}

export class PacketsManager{
    packets:Map<PacketID,new () => Packet>
    constructor(){
        this.packets=new Map()
        this.add_packet(ConnectPacket)
        this.add_packet(DisconnectPacket)
        this.add_packet(SteamPacket)
        this.add_packet(ObjectsPacket)
    }
    encode(packet:Packet,stream:NetStream):NetStream{
        stream.writeUint16(packet.ID)
        packet.encode(stream)
        return stream
    }
    decode(stream:NetStream):Packet{
        const id:PacketID=stream.readUint16()
        if (this.packets.get(id)){
            // deno-lint-ignore ban-ts-comment
            //@ts-expect-error
            const pt:new () => Packet=this.packets.get(id)
            const p=new pt()
            p.decode(stream)
            p._size=stream.index
            return p
        }else{
            throw new Error(`the Packet ${id} dont exist`)
        }
    }
    add_packet(pack:new () => Packet){
        const p=new pack()
        this.packets.set(p.ID,pack)
    }
}

export class ConnectPacket extends Packet{
    client_id:ID
    readonly ID=65535
    readonly Name="connect"
    constructor(id:number=0){
        super()
        this.client_id=id
    }
    encode(stream: NetStream): void {
      stream.writeID(this.client_id)
    }
    decode(stream: NetStream): void {
      this.client_id=stream.readID()
    }
}
export class DisconnectPacket extends Packet{
    client_id:ID
    readonly ID=65534
    readonly Name="disconnect"
    constructor(id:number=0){
        super()
        this.client_id=id
    }
    encode(stream: NetStream): void {
      stream.writeID(this.client_id)
    }
    decode(stream: NetStream): void {
      this.client_id=stream.readID()
    }
}
export class SteamPacket extends Packet{
    readonly ID=65533
    readonly Name="stream"
    stream!:NetStream
    size:number=0
    constructor(){
        super()
    }
    encode(stream: NetStream): void {
        stream.writeUint32(this.size)
        stream.writeStream(this.stream,0,this.size)
    }
    decode(stream: NetStream): void {
        const size=stream.readUint32()
        this.stream=new NetStream(stream.buffer,stream.index,size)
    }
}
export class ObjectsPacket extends Packet{
    readonly ID=65532
    readonly Name="objects"
    stream!:NetStream
    size:number=0
    constructor(){
        super()
    }
    encode(stream: NetStream): void {
        stream.writeUint32(this.size)
        stream.writeStream(this.stream,0,this.size)
    }
    decode(stream: NetStream): void {
        const size=stream.readUint32()
        this.stream=new NetStream(stream.buffer,stream.index,size)
    }
}