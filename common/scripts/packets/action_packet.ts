import { NetStream, Packet, v2, Vec2 } from "../engine/mod.ts"
export class ActionPacket extends Packet{
    ID=1
    Name="action"
    Movement:Vec2
    UsingItem:boolean
    Reloading:boolean=false
    angle:number
    hand:number
    constructor(movement:Vec2=v2.new(0,0),using_item=false,angle:number=0,hand:number=0){
        super()
        this.Movement=movement
        this.UsingItem=using_item
        this.angle=angle
        this.hand=hand
    }
    encode(stream: NetStream): void {
      stream.writePosition(this.Movement)
      stream.writeBooleanGroup(this.UsingItem,this.Reloading)
      stream.writeRad(this.angle)
      stream.writeUint8(this.hand)
    }
    decode(stream: NetStream): void {
      this.Movement=stream.readPosition()
      const b=stream.readBooleanGroup()
      this.UsingItem=b[0]
      this.Reloading=b[1]
      this.angle=stream.readRad()
      this.hand=stream.readUint8()
    }
}