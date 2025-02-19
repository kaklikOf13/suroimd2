import { InventoryItemData, InventoryItemDataDecode, InventoryItemDataEncode, InventoryItemType } from "../definitions/utils.ts";
import { type NetStream, Packet } from "../engine/mod.ts"
import { ActionsType } from "../others/constants.ts";
export type HandData=({
    type:InventoryItemType.gun
    ammo:number
}&{location:number})|undefined
export class GuiPacket extends Packet{
    ID=2
    Name="gui"
    Health:number
    MaxHealth:number
    dirty={
        inventory:false,
        hand:false,
        action:false
    }
    inventory?:InventoryItemData[]
    hand?:HandData
    action?:{delay:number,type:ActionsType}
    constructor(health=0,max_health=0){
        super()
        this.Health=health
        this.MaxHealth=max_health
    }
    encode(stream: NetStream): void {
        stream.writeUint8(this.Health)
        stream.writeUint8(this.MaxHealth)
        stream.writeBooleanGroup(this.dirty.inventory,this.dirty.hand,this.hand!==undefined,this.dirty.action,this.action!==undefined)
        if(this.dirty.inventory){
            stream.writeArray<InventoryItemData>(this.inventory!,(i)=>{
                InventoryItemDataEncode(stream,i)
            },1)
        }
        if(this.dirty.hand&&this.hand){
            stream.writeUint8(this.hand.type)
            stream.writeUint8(this.hand.location)
            switch(this.hand.type){
                case InventoryItemType.gun:    
                stream.writeUint8(this.hand.ammo)
                break
            }
        }
        if(this.dirty.action&&this.action){
            stream.writeFloat(this.action.delay,0,20,3)
            stream.writeUint8(this.action.type)
        }
    }
    decode(stream: NetStream): void {
        this.Health=stream.readUint8()
        this.MaxHealth=stream.readUint8()
        const [dirtyInventory,dirtyHand,hasHand,dirtyAction,hasAction]=stream.readBooleanGroup()
        if(dirtyInventory){
            this.dirty.inventory=true
            this.inventory=stream.readArray<InventoryItemData>(()=>{
                return InventoryItemDataDecode(stream)
            },1)
        }
        if(dirtyHand){
            this.dirty.hand=true
            if(hasHand){
                this.hand={
                    type:stream.readUint8(),
                    location:stream.readUint8(),
                    ammo:0,
                }
                switch(this.hand.type){
                    case InventoryItemType.gun:
                        this.hand.ammo=stream.readUint8()
                        break
                }
            }else{
                this.hand=undefined
            }
        }
        if(dirtyAction){
            this.dirty.action=true
            if(hasAction){
                this.action={
                    delay:stream.readFloat(0,20,3),
                    type:stream.readUint8(),
                }
            }
        }
    }
}