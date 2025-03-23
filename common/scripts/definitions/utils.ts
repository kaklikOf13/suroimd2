import { type NetStream } from "../engine/stream.ts";
import { Definition } from "../engine/definitions.ts";
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
}
export const tracers={
    tiny:{
        width:1,
        height:0.4, // 1H = 0.05 radius
    },
    mirv:{
        height:0.4,
        width:1,
        color:0x0044aa
    }
}
export enum InventoryItemType{
    gun,
    ammo,
    healing,
    equipament,
    other
}
export interface GameItem extends Definition{
    item_type:InventoryItemType
    count:number
}
export enum DamageReason{
    Player,
    Explosion,
    SafeZone,
    Abstinence
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