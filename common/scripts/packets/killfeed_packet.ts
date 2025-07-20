import { type NetStream, Packet } from "../engine/mod.ts"
export enum KillFeedMessageType{
    kill,
    down,
    join,
}
export interface KillFeedMessageKill{
    type:KillFeedMessageType.kill|KillFeedMessageType.down,
    victimId:number
    killerId:number
    used:number
}
export interface KillFeedMessageJoin{
    type:KillFeedMessageType.join
    playerId:number
    playerName:string
}
export type KillFeedMessage=KillFeedMessageKill|KillFeedMessageJoin
export class KillFeedPacket extends Packet{
    ID=4
    Name="killfeed"
    message!:KillFeedMessage
    constructor(){
        super()
    }
    encode(stream: NetStream): void {
        stream.writeUint8(this.message.type)
        switch(this.message.type){
            case KillFeedMessageType.kill:
            case KillFeedMessageType.down:
                stream.writeUint16(this.message.killerId)
                stream.writeUint16(this.message.victimId)
                stream.writeUint16(this.message.used)
                break
            case KillFeedMessageType.join:
                stream.writeUint16(this.message.playerId)
                stream.writeStringSized(28,this.message.playerName)
                break
        }
    }
    decode(stream: NetStream): void {
        const msg={
            type:stream.readUint8() as KillFeedMessageType,
        } as Record<string,unknown>
        switch(msg.type){
            case KillFeedMessageType.kill:
            case KillFeedMessageType.down:
                msg["killerId"]=stream.readUint16()
                msg["victimId"]=stream.readUint16()
                msg["used"]=stream.readUint16()
                break
            case KillFeedMessageType.join:
                msg["playerId"]=stream.readUint16()
                msg["playerName"]=stream.readStringSized(28)
                break
        }
        this.message=msg as unknown as KillFeedMessage
    }
}