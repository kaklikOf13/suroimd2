import { Vec2 } from "../engine/geometry.ts";

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
    vertex:Vec2[]
}
export class TerrainManager{
    floors:Record<number,Floor[]>={0:[]}
    add_floor(type:FloorType,vertex:Vec2[],layer:number=0){
        this.floors[layer].push({type:type,vertex:vertex})
    }
}