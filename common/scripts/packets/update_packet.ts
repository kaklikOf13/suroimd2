import { type GunDef, Guns } from "../definitions/items/guns.ts";
import { type MeleeDef, Melees } from "../definitions/items/melees.ts";
import { BoostType } from "../definitions/player/boosts.ts";
import { InventoryItemData } from "../definitions/utils.ts";
import { Vec2 } from "../engine/geometry.ts";
import { type NetStream, Packet } from "../engine/mod.ts"
import { ActionsType } from "../others/constants.ts";
export interface DamageSplash{
    count:number
    position:Vec2
    taker:number
    taker_layer:number
    shield:boolean
    critical:boolean
    shield_break:boolean
}
export interface GuiUpdate{
    dirty:{
        inventory:boolean
        weapons:boolean
        current_weapon:boolean
        action:boolean
        ammos:boolean
    }

    health:number
    max_health:number

    boost:number
    max_boost:number
    boost_type:BoostType

    inventory?:InventoryItemData[]
    action?:{delay:number,type:ActionsType}
    weapons:{
        melee?:MeleeDef
        gun1?:GunDef
        gun2?:GunDef
    }

    current_weapon?:{
        slot:number
        ammo:number
    }

    ammos:Record<number,number>

    damages:DamageSplash[]
}
function encode_gui_packet(gui:GuiUpdate,stream:NetStream){
    stream.writeUint8(gui.health)
    stream.writeUint8(gui.max_health)
    stream.writeUint8(gui.boost)
    stream.writeUint8(gui.max_boost)
    stream.writeUint8(gui.boost_type)
    stream.writeBooleanGroup(
        gui.dirty.inventory,
        gui.dirty.weapons,
        gui.dirty.current_weapon,
        gui.dirty.action,
        gui.dirty.ammos,
        gui.action!==undefined,
        gui.damages!==undefined)
    if(gui.dirty.inventory){
        stream.writeArray<InventoryItemData>(gui.inventory!,(i)=>{
            stream.writeUint16(i.idNumber)
            stream.writeUint8(i.type)
            stream.writeUint8(i.count)
        },1)
    }
    if(gui.dirty.weapons){
        stream.writeInt16(gui.weapons.melee?.idNumber??-1)
        stream.writeInt16(gui.weapons.gun1?.idNumber??-1)
        stream.writeInt16(gui.weapons.gun2?.idNumber??-1)
    }
    if(gui.dirty.current_weapon){
        stream.writeInt8(gui.current_weapon!.slot)
        stream.writeUint16(gui.current_weapon!.ammo)
    }
    if(gui.dirty.action&&gui.action){
        stream.writeFloat(gui.action.delay,0,20,3)
        stream.writeUint8(gui.action.type)
    }
    if(gui.damages){
        stream.writeArray(gui.damages,(d)=>{
            stream.writeBooleanGroup(d.critical,d.shield,d.shield_break)
            stream.writeUint16(d.count)
            stream.writePosition(d.position)
            stream.writeID(d.taker)
            stream.writeUint8(d.taker_layer)
        },1)
    }

    if(gui.dirty.ammos){
        stream.writeArray(Object.entries(gui.ammos),(i)=>{
            stream.writeUint8(i[0] as unknown as number)
            stream.writeUint16(i[1] as unknown as number)
        },1)
    }
}
function decode_gui_packet(gui:GuiUpdate,stream:NetStream){
    gui.health=stream.readUint8()
    gui.max_health=stream.readUint8()
    gui.boost=stream.readUint8()
    gui.max_boost=stream.readUint8()
    gui.boost_type=stream.readUint8()
    const [
        dirtyInventory,
        dirtyWeapons,
        dirtyCurrentWeapon,
        dirtyAction,
        dirtyAmmos,
        hasAction,
        hasDamages]=stream.readBooleanGroup()
    gui.dirty={
        inventory:dirtyInventory,
        weapons:dirtyWeapons,
        current_weapon:dirtyCurrentWeapon,
        action:dirtyAction,
        ammos:dirtyAmmos
    }
    if(dirtyInventory){
        gui.dirty.inventory=true
        gui.inventory=stream.readArray<InventoryItemData>(()=>{
            return {
                idNumber:stream.readUint16(),
                type:stream.readUint8(),
                count:stream.readUint8()
            }
        },1)
    }
    if(dirtyWeapons){
        const melee=stream.readInt16()
        const gun1=stream.readInt16()
        const gun2=stream.readInt16()
        if(melee!==-1)gui.weapons.melee=Melees.getFromNumber(melee)
        else gui.weapons.melee=undefined
        if(gun1!==-1)gui.weapons.gun1=Guns.getFromNumber(gun1)
        else gui.weapons.gun1=undefined
        if(gun2!==-1)gui.weapons.gun2=Guns.getFromNumber(gun2)
        else gui.weapons.gun2=undefined
    }
    if(dirtyCurrentWeapon){
        gui.current_weapon={
            slot:stream.readInt8(),
            ammo:stream.readUint16()
        }
    }
    if(dirtyAction){
        gui.dirty.action=true
        if(hasAction){
            gui.action={
                delay:stream.readFloat(0,20,3),
                type:stream.readUint8(),
            }
        }
    }
    if(hasDamages){
        gui.damages=stream.readArray(()=>{
            const boo=stream.readBooleanGroup()
            return {
                count:stream.readUint16(),
                critical:boo[0],
                shield:boo[1],
                shield_break:boo[2],
                position:stream.readPosition(),
                taker:stream.readID(),
                taker_layer:stream.readInt8()
            }
        },1)
    }
    if(dirtyAmmos){
        const len=stream.readUint8()
        gui.ammos={}
        for(let i=0;i<len;i++){
            gui.ammos[stream.readUint8()]=stream.readUint16()
        }
    }
}
export class UpdatePacket extends Packet{
    ID=2
    Name="update"

    gui:GuiUpdate={
        boost:0,
        boost_type:BoostType.Shield,
        dirty:{
            action:false,
            current_weapon:false,
            inventory:false,
            weapons:false,
            ammos:false
        },
        ammos:{},
        health:0,
        max_boost:0,
        max_health:0,
        weapons:{
            gun1:undefined,
            gun2:undefined,
            melee:undefined
        },
        action:undefined,
        current_weapon:{
            ammo:0,
            slot:0
        },
        damages:[],
        inventory:undefined
    }

    objects?:NetStream
    constructor(){
        super()
    }
    encode(stream: NetStream): void {
        stream.writeStreamDynamic(this.objects!)
        encode_gui_packet(this.gui,stream)
    }
    decode(stream: NetStream): void {
        this.objects=stream.readStreamDynamic()
        decode_gui_packet(this.gui,stream)
    }
}