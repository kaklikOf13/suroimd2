import { NetStream, Packet, v2, Vec2 } from "../engine/mod.ts"
export enum CellphoneActionType{
    GiveItem,
    SpawnObstacle
}
export type CellphoneAction=(
    {
        type:CellphoneActionType.GiveItem
        item_id:number
        count:number
    }|
    {
        type:CellphoneActionType.SpawnObstacle
    }
)|undefined
export class ActionPacket extends Packet{
    ID=1
    Name="action"
    Movement:Vec2
    UsingItem:boolean
    Reloading:boolean=false
    angle:number
    hand:number
    cellphoneAction:CellphoneAction
    interact:boolean=false
    use_slot:number=-1

    drop_kind:number=0
    drop:number=0
    constructor(){
        super()
        this.Movement=v2.new(0,0)
        this.UsingItem=false
        this.angle=0
        this.hand=0
    }
    encode(stream: NetStream): void {
      stream.writeFloat(this.Movement.x,-1,1,3)
      stream.writeFloat(this.Movement.y,-1,1,3)
      stream.writeBooleanGroup(this.UsingItem,this.Reloading,this.cellphoneAction!==undefined,this.interact)
      stream.writeRad(this.angle)
      stream.writeInt8(this.hand)
      stream.writeInt8(this.use_slot)
      stream.writeInt8(this.drop)
      stream.writeInt8(this.drop_kind)
      if(this.cellphoneAction){
        stream.writeUint8(this.cellphoneAction.type)
        switch(this.cellphoneAction.type){
          case CellphoneActionType.GiveItem:
            stream.writeUint16(this.cellphoneAction.item_id)
            .writeUint16(this.cellphoneAction.count)
            break
          case CellphoneActionType.SpawnObstacle:
            break
        }
      }
    }
    decode(stream: NetStream): void {
      this.Movement={
        x:stream.readFloat(-1,1,3),
        y:stream.readFloat(-1,1,3)
      }
      const b=stream.readBooleanGroup()
      this.UsingItem=b[0]
      this.Reloading=b[1]
      this.interact=b[3]
      this.angle=stream.readRad()
      this.hand=stream.readInt8()
      this.use_slot=stream.readInt8()
      this.drop=stream.readInt8()
      this.drop_kind=stream.readInt8()
      if(b[2]){
        switch(stream.readUint8() as CellphoneActionType){
          case CellphoneActionType.GiveItem:
            this.cellphoneAction={
              type:CellphoneActionType.GiveItem,
              item_id:stream.readUint16(),
              count:stream.readUint16()
            }
            break
          case CellphoneActionType.SpawnObstacle:
            this.cellphoneAction={
              type:CellphoneActionType.SpawnObstacle,
            }
            break
        }
      }
    }
}