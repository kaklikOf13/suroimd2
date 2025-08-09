import { type NetStream, Packet } from "../engine/mod.ts"
export class JoinPacket extends Packet{
    ID=0
    Name="join"
    PlayerName:string
    skin:number
    constructor(playerName:string=""){
        super()
        this.PlayerName=playerName
        this.skin=0
    }
    encode(stream: NetStream): void {
      stream.writeStringSized(28,this.PlayerName)
      stream.writeUint16(this.skin)
    }
    decode(stream: NetStream): void {
      this.PlayerName=stream.readStringSized(28)
      this.skin=stream.readUint16()
    }
}