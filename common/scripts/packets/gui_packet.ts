import { InventoryItemData, InventoryItemDataDecode, InventoryItemDataEncode } from "common/scripts/definitions/utils.ts";
import { type NetStream, Packet } from "../engine/mod.ts"

export class GuiPacket extends Packet{
    ID=2
    Name="gui"
    Health:number
    MaxHealth:number
    dirty={
        inventory:false
    }
    inventory?:InventoryItemData[]
    constructor(health=0,max_health=0){
        super()
        this.Health=health
        this.MaxHealth=max_health
    }
    encode(stream: NetStream): void {
        stream.writeUint8(this.Health)
        stream.writeUint8(this.MaxHealth)
        stream.writeBooleanGroup(this.dirty.inventory)
        if(this.dirty.inventory){
            stream.writeArray<InventoryItemData>(this.inventory!,(i)=>{
                InventoryItemDataEncode(stream,i)
            },1)
        }
    }
    decode(stream: NetStream): void {
        this.Health=stream.readUint8()
        this.MaxHealth=stream.readUint8()
        const [dirtyInventory]=stream.readBooleanGroup()
        if(dirtyInventory){
            this.inventory=stream.readArray<InventoryItemData>(()=>{
                return InventoryItemDataDecode(stream)
            },1)
        }
    }
}