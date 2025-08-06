import { type NetStream, Packet } from "../engine/mod.ts"
export class JoinedPacket extends Packet{
    ID=5
    Name="joined"
    players:{id:number,name:string}[]=[]
    kill_leader?:{id:number,kills:number}
    constructor(){
        super()
    }
    encode(stream: NetStream): void {
      stream.writeBooleanGroup(this.kill_leader!==undefined)
      if(this.kill_leader){
        stream.writeID(this.kill_leader.id)
        stream.writeUint8(this.kill_leader.kills)
      }
      stream.writeArray(this.players,(e)=>{
        stream.writeStringSized(28,e.name)
        stream.writeID(e.id)
      },1)
    }
    decode(stream: NetStream): void {
      const [killleader]=stream.readBooleanGroup()
      if(killleader){
        this.kill_leader={
          id:stream.readID(),
          kills:stream.readUint8()
        }
      }
      this.players=stream.readArray((e)=>{
        return {
          name:stream.readStringSized(28),
          id:stream.readID()
        }
      },1)
    }
}