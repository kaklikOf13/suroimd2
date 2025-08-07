import { v2, Vec2 } from "../engine/geometry.ts";
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
        default_color:0x3e54a3,
        speed_mult:0.6
    }
}
export interface Floor{
    type:FloorType
    smooth:boolean
    hb:Hitbox2D
    layer:number
}
export class TerrainManager{
    floors:Floor[]=[]
    grid=new Map<number,Map<number,{
        floors:Floor[]
    }>>()
    add_floor(type:FloorType,hb:Hitbox2D,layer:number=0,smooth:boolean=true){
        const floor={type,hb,smooth,layer}
        this.floors.push(floor)
        const rect=hb.toRect()
        const min=this.cell_pos(rect.min)
        const max=this.cell_pos(rect.max)
        for (let y = min.y; y <= max.y; y++) {
            if(!this.grid.has(y))this.grid.set(y,new Map())
            for (let x = min.x; x <= max.x; x++) {
            if(!this.grid.get(y)!.get(x))this.grid.get(y)!.set(x,{floors:[]})
                this.grid.get(y)!.get(x)!.floors.push(floor);
            }
        }
    }
    get_floor(position:Vec2,layer:number):Floor|undefined{
        const pos=this.cell_pos(position)
        let floor:Floor|undefined=undefined
        for(const f of this.grid.get(pos.y)?.get(pos.x)?.floors??[]){
            if(f.layer===layer&&f.hb.pointInside(position))floor=f
        }
        return floor
    }
    get_floor_type(position:Vec2,layer:number,place_holder:FloorType):FloorType{
        const pos=this.cell_pos(position)
        let floor:FloorType=place_holder
        for(const f of this.grid.get(pos.y)?.get(pos.x)?.floors??[]){
            if(f.layer===layer&&f.hb.pointInside(position))floor=f.type
        }
        return floor
    }
    cell_pos(p:Vec2):Vec2{
        return v2.floor(v2.dscale(p,10))
    }
}