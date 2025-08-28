import { ProjectileData } from "common/scripts/others/objectsEncode.ts";
import { type Camera2D, type Sprite, type Renderer } from "../engine/mod.ts";
import { Debug } from "../others/config.ts";
import { ProjectileDef, Projectiles } from "common/scripts/definitions/projectiles.ts";
import { Angle, CircleHitbox2D, v2 } from "common/scripts/engine/mod.ts";
import { GameObject } from "../others/gameObject.ts";
export class Projectile extends GameObject{
    stringType:string="projectile"
    numberType: number=6
    name:string=""

    rotation:number=0
    zpos:number=0

    spr!:Sprite

    def!:ProjectileDef

    create(_args: Record<string, void>): void {
      
    }

    render(camera: Camera2D, renderer: Renderer,_dt:number): void {
        if(this.spr){
            const zs=this.def.zBaseScale+(this.def.zScaleAdd*this.zpos)
            renderer.draw_image2D(this.spr,v2.sub(this.position,camera.position),v2.new(zs,zs),Angle.rad2deg(this.rotation),v2.new(.5,.5))
            /*if(Debug.hitbox){
                renderer.draw_hitbox2D(this.hb,this.game.resources.get_material2D("hitbox_projectile"),camera.position)
            }*/
        }
    }

    update(_dt:number): void {
        
    }
    constructor(){
        super()
    }
    updateData(data:ProjectileData){
        if(data.full){
            this.def=Projectiles.getFromNumber(data.full.definition)
            this.hb=new CircleHitbox2D(data.position,this.def.radius)
            this.spr=this.game.resources.get_sprite(this.def.frames.world)
        }
        this.position=data.position
        this.rotation=data.rotation
        this.zpos=data.z
    }
}