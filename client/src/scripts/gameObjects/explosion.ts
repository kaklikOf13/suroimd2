import { ExplosionData } from "common/scripts/others/objectsEncode.ts";
import { Color, Material2D, WebglRenderer } from "../engine/mod.ts";
import { CircleHitbox2D } from "common/scripts/engine/mod.ts";
import { ExplosionDef, Explosions } from "common/scripts/definitions/explosions.ts";
import { ColorM } from "../engine/renderer.ts";
import { FormGameObject } from "../others/gameObject.ts";
export class Explosion extends FormGameObject{
    material!:Material2D<Color>
    stringType:string="explosion"
    numberType: number=5
    def!:ExplosionDef
    maxRadius:number=3
    create(_args: Record<string, void>): void {
        this.hb=new CircleHitbox2D(this.position,0)
        this.material=(this.game.renderer as WebglRenderer).factorys2D.simple.create_material(ColorM.default.red)
    }
    update(_dt:number): void {
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
        this.material.args=ColorM.hex(this.def.tint)
    }
}