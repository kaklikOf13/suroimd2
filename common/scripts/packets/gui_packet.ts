import { type NetStream, Packet } from "../engine/mod.ts"
export class GuiPacket extends Packet{
    ID=2
    Name="gui"
    Health:number
    MaxHealth:number
    constructor(health=0,max_health=0){
        super()
        this.Health=health
        this.MaxHealth=max_health
    }
    encode(stream: NetStream): void {
        stream.writeUint8(this.Health)
        stream.writeUint8(this.MaxHealth)
    }
    decode(stream: NetStream): void {
        this.Health=stream.readUint8()
        this.MaxHealth=stream.readUint8()
    }
}