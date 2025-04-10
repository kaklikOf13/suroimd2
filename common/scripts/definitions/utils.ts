import { type NetStream } from "../engine/stream.ts";
import { Definition } from "../engine/definitions.ts";
import { type ItemQuality } from "../others/constants.ts";
export interface BulletDef{
    damage:number
    range:number
    speed:number
    radius:number
    tracer:{
        width:number
        height:number
        color?:number
    }
    obstacleMult?:number
    criticalMult?:number
}
export enum InventoryItemType{
    gun,
    ammo,
    healing,
    equipament,
    other,
    accessorie
}
export interface GameItem extends Definition{
    item_type:InventoryItemType
    quality:ItemQuality
}
export enum DamageReason{
    Player,
    Explosion,
    SafeZone,
    Abstinence,
    Disconnect
}
export interface InventoryItemData{
    count:number
    type:InventoryItemType
    idNumber:number
}
export function InventoryItemDataEncode(stream:NetStream,data:InventoryItemData){
    stream.writeUint16(data.count)
    stream.writeUint16(data.idNumber)
    stream.writeUint8(data.type)
}
export function InventoryItemDataDecode(stream:NetStream):InventoryItemData{
    return {
        count:stream.readUint16(),
        idNumber:stream.readUint16(),
        type:stream.readUint8(),
    }
}

export enum BoostType{
    Shield,
    Adrenaline,
    Mana,
    Addiction
}