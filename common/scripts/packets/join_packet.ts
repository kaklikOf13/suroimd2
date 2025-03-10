import { type NetStream, Packet } from "../engine/mod.ts"
export class JoinPacket extends Packet{
    ID=0
    Name="join"
    PlayerName:string
    constructor(playerName:string=""){
        super()
        this.PlayerName=playerName
    }
    encode(stream: NetStream): void {
      stream.writeString(this.PlayerName)
    }
    decode(stream: NetStream): void {
      this.PlayerName=stream.readString()
    }
}