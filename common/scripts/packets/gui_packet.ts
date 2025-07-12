import { type GunDef, Guns } from "../definitions/guns.ts";
import { type MeleeDef, Melees } from "../definitions/melees.ts";
import { BoostType, InventoryItemData, InventoryItemDataDecode, InventoryItemDataEncode } from "../definitions/utils.ts";
import { Vec2 } from "../engine/geometry.ts";
import { type NetStream, Packet } from "../engine/mod.ts"
import { ActionsType } from "../others/constants.ts";
export interface DamageSplash{
    count:number
    critical:boolean
    position:Vec2
    shield:boolean
}
export class GuiPacket extends Packet{
    ID=2
    Name="gui"
    Health:number
    MaxHealth:number
    Boost:number
    MaxBoost:number
    BoostType:BoostType
    dirty={
        inventory:false,
        weapons:false,
        current_weapon:false,
        action:false
    }
    inventory?:InventoryItemData[]
    action?:{delay:number,type:ActionsType}
    weapons={
        melee:undefined as (undefined|MeleeDef),
        gun1:undefined as (undefined|GunDef),
        gun2:undefined as (undefined|GunDef)
    }

    current_weapon?:{
        slot:number,
        ammo:number
    }

    damages?:DamageSplash
    constructor(health=0,max_health=0,boost:number=0,max_boost:number=0,boost_type:BoostType=0){
        super()
        this.Health=health
        this.MaxHealth=max_health
        this.Boost=boost
        this.MaxBoost=max_boost
        this.BoostType=boost_type
    }
    encode(stream: NetStream): void {
        stream.writeUint8(this.Health)
        stream.writeUint8(this.MaxHealth)
        stream.writeUint8(this.Boost)
        stream.writeUint8(this.MaxBoost)
        stream.writeUint8(this.BoostType)
        stream.writeBooleanGroup(
            this.dirty.inventory,
            this.dirty.weapons,
            this.dirty.current_weapon,
            this.dirty.action,
            this.action!==undefined,
            this.damages!==undefined)
        if(this.dirty.inventory){
            stream.writeArray<InventoryItemData>(this.inventory!,(i)=>{
                InventoryItemDataEncode(stream,i)
            },1)
        }
        if(this.dirty.weapons){
            stream.writeInt16(this.weapons.melee?.idNumber??-1)
            stream.writeInt16(this.weapons.gun1?.idNumber??-1)
            stream.writeInt16(this.weapons.gun2?.idNumber??-1)
            /*stream.writeUint8(this.hand.type)
            stream.writeUint8(this.hand.location)
            switch(this.hand.type){
                case InventoryItemType.gun:    
                stream.writeUint8(this.hand.ammo)
                stream.writeUint16(this.hand.disponibility)
                break
            }*/
        }
        if(this.dirty.current_weapon){
            stream.writeInt8(this.current_weapon!.slot)
            stream.writeUint16(this.current_weapon!.ammo)
        }
        if(this.dirty.action&&this.action){
            stream.writeFloat(this.action.delay,0,20,3)
            stream.writeUint8(this.action.type)
        }
        if(this.damages){
            stream.writeBooleanGroup(this.damages.critical,this.damages.shield)
            stream.writeUint16(this.damages.count)
            stream.writePosition(this.damages.position)
        }
    }
    decode(stream: NetStream): void {
        this.Health=stream.readUint8()
        this.MaxHealth=stream.readUint8()
        this.Boost=stream.readUint8()
        this.MaxBoost=stream.readUint8()
        this.BoostType=stream.readUint8()
        const [
            dirtyInventory,
            dirtyWeapons,
            dirtyCurrentWeapon,
            dirtyAction,
            hasAction,
            hasDamages]=stream.readBooleanGroup()
        if(dirtyInventory){
            this.dirty.inventory=true
            this.inventory=stream.readArray<InventoryItemData>(()=>{
                return InventoryItemDataDecode(stream)
            },1)
        }
        if(dirtyWeapons){
            this.weapons.melee=Melees.getFromNumber(stream.readInt16())
            this.weapons.gun1=Guns.getFromNumber(stream.readInt16())
            this.weapons.gun2=Guns.getFromNumber(stream.readInt16())
            /*this.dirty.hand=true
            if(hasHand){
                this.hand={
                    type:stream.readUint8(),
                    location:stream.readUint8(),
                    ammo:0,
                    disponibility:0
                }
                switch(this.hand.type){
                    case InventoryItemType.gun:
                        this.hand.ammo=stream.readUint8()
                        this.hand.disponibility=stream.readUint16()
                        break
                }
            }else{
                this.hand=undefined
            }*/
        }
        if(dirtyCurrentWeapon){
            this.current_weapon={
                slot:stream.readInt8(),
                ammo:stream.readUint16()
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
        if(hasDamages){
            const boo=stream.readBooleanGroup()
            this.damages={
                count:stream.readUint16(),
                critical:boo[0],
                shield:boo[1],
                position:stream.readPosition()
            }
        }
    }
}