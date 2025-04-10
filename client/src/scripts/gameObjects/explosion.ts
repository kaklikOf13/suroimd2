import { ExplosionData } from "common/scripts/others/objectsEncode.ts";
import { Color } from "../engine/mod.ts";
import { CircleHitbox2D, v2 } from "common/scripts/engine/mod.ts";
import { ExplosionDef, Explosions } from "common/scripts/definitions/explosions.ts";
import { Camera2D, ColorM, Renderer } from "../engine/renderer.ts";
import { GameObject } from "../others/gameObject.ts";
import { Sprite } from "../engine/resources.ts";
import { zIndexes } from "common/scripts/others/constants.ts";
export class Explosion extends GameObject{
    stringType:string="explosion"
    numberType: number=5
    def!:ExplosionDef
    maxRadius:number=3

    declare hb:CircleHitbox2D

    sprite!:Sprite
    create(_args: Record<string, void>): void {
        this.hb=new CircleHitbox2D(this.position,0)
        this.sprite=this.game.resources.get_sprite("base_explosion")
    }
    update(dt:number): void {
        if(this.def){
            if((this.hb as CircleHitbox2D).radius>=this.maxRadius){
                this.destroy()
            }else{
                (this.hb as CircleHitbox2D).radius+=8*dt
            }
        }
    }
    tint!:Color
    render(camera: Camera2D, renderer: Renderer, _dt: number): void {
        if(this.sprite)renderer.draw_image2D(this.sprite,v2.sub(this.position,camera.position),v2.new(this.hb.radius,this.hb.radius),0,v2.new(.5,.5),zIndexes.Explosions,this.tint,v2.new(600,600))
    }
    constructor(){
        super()
    }
    updateData(data:ExplosionData){
        if(this.def)return
        this.position=data.position
        this.def=Explosions.getFromNumber(data.def)
        this.tint=ColorM.hex(this.def.tint)
        this.maxRadius=data.radius
    }
}