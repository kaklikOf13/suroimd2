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
    constructor(movement:Vec2=v2.new(0,0),using_item=false,angle:number=0,hand:number=0){
        super()
        this.Movement=movement
        this.UsingItem=using_item
        this.angle=angle
        this.hand=hand
    }
    encode(stream: NetStream): void {
      stream.writePosition(this.Movement)
      stream.writeBooleanGroup(this.UsingItem,this.Reloading,this.cellphoneAction!==undefined)
      stream.writeRad(this.angle)
      stream.writeUint8(this.hand)
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
      this.Movement=stream.readPosition()
      const b=stream.readBooleanGroup()
      this.UsingItem=b[0]
      this.Reloading=b[1]
      this.angle=stream.readRad()
      this.hand=stream.readUint8()
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