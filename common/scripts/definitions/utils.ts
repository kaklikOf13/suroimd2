import { type NetStream } from "../engine/stream.ts";
import { Definition } from "../engine/definitions.ts";
import { ItemQuality } from "../others/item.ts";
export interface BulletDef{
    damage:number
    falloff?:number
    range:number
    speed:number
    radius:number
    tracer:{
        width:number
        height:number
        particles?:{
            frame:number
        }
        proj:{
            img:number
            width:number
            height:number
            color?:number
        }
        color?:number
    }
    obstacleMult?:number
    criticalMult?:number
    on_hit_explosion?:string
}
export enum InventoryItemType{
    gun,
    ammo,
    consumible,
    equipament,
    other,
    melee,
    accessorie,
    backpack,
    skin,
    scope
}
export interface GameItem extends Definition{
    item_type:InventoryItemType
    quality:ItemQuality
}
export enum DamageReason{
    Player,
    Explosion,
    DeadZone,
    Abstinence,
    SideEffect,
    Disconnect,
    Bleend
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
