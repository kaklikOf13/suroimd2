import { ExplosionData } from "common/scripts/others/objectsEncode.ts";
import { Color } from "../engine/mod.ts";
import { CircleHitbox2D, v2 } from "common/scripts/engine/mod.ts";
import { ExplosionDef, Explosions } from "common/scripts/definitions/explosions.ts";
import { ColorM, Sprite2D } from "../engine/renderer.ts";
import { GameObject } from "../others/gameObject.ts";
export class Explosion extends GameObject{
    stringType:string="explosion"
    numberType: number=5
    def!:ExplosionDef
    maxRadius:number=3

    declare hb:CircleHitbox2D

    sprite:Sprite2D=new Sprite2D()
    create(_args: Record<string, void>): void {
        this.hb=new CircleHitbox2D(this.position,0)
        this.sprite.sprite=this.game.resources.get_sprite("base_explosion")
        this.game.camera.addObject(this.sprite)
    }
    update(dt:number): void {
        if(this.def){
            if((this.hb as CircleHitbox2D).radius>=this.maxRadius){
                if(this.sprite.tint.a>0){
                    this.sprite.tint.a-=1*dt
                }else{
                    this.destroy()
                }
            }else{
                (this.hb as CircleHitbox2D).radius+=7*dt
                this.sprite.scale=v2.new((this.hb as CircleHitbox2D).radius,(this.hb as CircleHitbox2D).radius)
            }
        }
    }
    override onDestroy(): void {
      this.sprite.destroy()
    }
    constructor(){
        super()
        this.sprite.visible=false
        this.sprite.hotspot=v2.new(.5,.5)
        this.sprite.size=v2.new(400,400)
    }
    override updateData(data:ExplosionData){
        if(this.def)return
        this.position=data.position
        this.def=Explosions.getFromNumber(data.def)
        this.sprite.tint=ColorM.hex(this.def.tint)
        this.maxRadius=data.radius
        this.sprite.position=this.position
        this.sprite.visible=true
    }
}