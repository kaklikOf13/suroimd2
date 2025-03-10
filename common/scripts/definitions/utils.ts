import { type NetStream } from "../engine/stream.ts";

export interface BulletDef{
    damage:number
    range:number
    speed:number
    radius:number
    tracer:{
        width:number
        height:number
    }
}
export const tracers={
    redTiny:{
        width:1,
        height:0.4, // 1H = 0.05 radius
    }
}
export enum InventoryItemType{
    gun,
    ammo,
    healing
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

export enum ExtraType{
    Shield,
    Adrenaline
}