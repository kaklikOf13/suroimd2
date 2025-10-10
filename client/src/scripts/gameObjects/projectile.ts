import { ProjectileData } from "common/scripts/others/objectsEncode.ts"
import { ProjectileDef, Projectiles } from "common/scripts/definitions/objects/projectiles.ts"
import { CircleHitbox2D, v2 } from "common/scripts/engine/mod.ts"
import { GameObject } from "../others/gameObject.ts"
import { Sprite2D } from "../engine/container_2d.ts"
export class Projectile extends GameObject{
    stringType:string="projectile"
    numberType: number=6

    rotation:number=0
    zpos:number=0

    sprite:Sprite2D=new Sprite2D

    def!:ProjectileDef

    create(_args: Record<string, void>): void {
        this.game.camera.addObject(this.sprite)
    }
    override on_destroy(): void {
        this.sprite.destroy()
    }

    update(_dt:number): void {
        this.sprite.position=this.position
        this.sprite.rotation=this.rotation
        const s=(this.def.zBaseScale+(this.def.zScaleAdd*this.zpos))*2
        this.sprite.scale=v2.new(s,s)
    }
    constructor(){
        super()
    }
    override updateData(data:ProjectileData){
        if(data.full){
            this.def=Projectiles.getFromNumber(data.full.definition)
            this.hb=new CircleHitbox2D(data.position,this.def.radius)
            this.sprite.set_frame({
                image:this.def.frames.world,
                hotspot:v2.new(.5,.5),
                scale:1
            },this.game.resources)
        }
        this.position=data.position
        this.rotation=data.rotation
        this.zpos=data.z
    }
}