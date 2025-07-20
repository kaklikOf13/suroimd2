import { type NetStream, Packet } from "../engine/mod.ts"
export class JoinedPacket extends Packet{
    ID=5
    Name="joined"
    players:{id:number,name:string}[]=[]
    constructor(){
        super()
    }
    encode(stream: NetStream): void {
      stream.writeArray(this.players,(e)=>{
        stream.writeStringSized(28,e.name)
        stream.writeUint16(e.id)
      },1)
    }
    decode(stream: NetStream): void {
      this.players=stream.readArray((e)=>{
        return {
          name:stream.readStringSized(28),
          id:stream.readUint16()
        }
      },1)
    }
}