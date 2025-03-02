import { ExplosionData } from "common/scripts/others/objectsEncode.ts";
import { Color, FormGameObject2D, HEXCOLOR, Material2D, RGBA, WebglRenderer } from "../engine/mod.ts";
import { CircleHitbox2D } from "common/scripts/engine/mod.ts";
import { ExplosionDef, Explosions } from "common/scripts/definitions/explosions.ts";
import { Camera2D, Renderer } from "../engine/renderer.ts";
export class Explosion extends FormGameObject2D{
    material!:Material2D<Color>
    objectType:string="explosion"
    numberType: number=5
    def!:ExplosionDef
    maxRadius:number=3
    create(_args: Record<string, void>): void {
        this.hb=new CircleHitbox2D(this.position,0)
        this.material=(this.game.renderer as WebglRenderer).factorys2D.simple.create_material(RGBA.new(1,0,0))
    }
    update(): void {
        if(this.def){
            if((this.hb as CircleHitbox2D).radius>=this.maxRadius){
                this.destroy()
            }else{
                (this.hb as CircleHitbox2D).radius+=0.4
            }
        }
    }
    constructor(){
        super()
    }
    updateData(data:ExplosionData){
        if(this.def)return
        this.position=data.position
        this.def=Explosions.getFromNumber(data.def)
        this.material.args=HEXCOLOR.new(this.def.tint)
    }
}