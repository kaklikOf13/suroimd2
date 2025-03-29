import { type NetStream, Packet } from "../engine/mod.ts"
import { GameConstants } from "common/scripts/others/constants.ts";
export class JoinPacket extends Packet{
    ID=0
    Name="join"
    PlayerName:string
    constructor(playerName:string=""){
        super()
        this.PlayerName=playerName
    }
    encode(stream: NetStream): void {
      stream.writeStringSized(GameConstants.player.max_name_size,this.PlayerName)
    }
    decode(stream: NetStream): void {
      this.PlayerName=stream.readString()
    }
}