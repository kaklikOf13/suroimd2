import { Vec2 } from "../engine/geometry.ts";
import { Hitbox2D } from "../engine/hitbox.ts";

export enum FloorType{
    Grass=0,
    Sand,
    Water,
}
export interface FloorDef{
    default_color:number
    speed_mult?:number
}
export const Floors:Record<FloorType,FloorDef>={
    [FloorType.Grass]:{
        default_color:0x5e8739
    },
    [FloorType.Sand]:{
        default_color:0xcfa138
    },
    [FloorType.Water]:{
        default_color:0x3e54a3
    }
}
export interface Floor{
    type:FloorType
    smooth:boolean
    hb:Hitbox2D
}
export class TerrainManager{
    floors:Record<number,Floor[]>={0:[]}
    add_floor(type:FloorType,hb:Hitbox2D,layer:number=0,smooth:boolean=true){
        this.floors[layer].push({type,hb,smooth})
    }
}