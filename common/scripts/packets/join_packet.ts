import { type NetStream, Packet } from "../engine/mod.ts"
export class JoinPacket extends Packet{
    ID=0
    Name="join"
    PlayerName:string
    skin:number
    is_mobile:boolean
    constructor(playerName:string=""){
        super()
        this.PlayerName=playerName
        this.is_mobile=false
        this.skin=0
    }
    encode(stream: NetStream): void {
      stream.writeStringSized(28,this.PlayerName)
      stream.writeUint16(this.skin)
      stream.writeBooleanGroup(this.is_mobile)
    }
    decode(stream: NetStream): void {
      this.PlayerName=stream.readStringSized(28)
      this.skin=stream.readUint16()
      const bg=stream.readBooleanGroup()
      this.is_mobile=bg[0]
    }
}