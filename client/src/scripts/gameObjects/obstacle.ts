import { ObstacleData } from "common/scripts/others/objectsEncode.ts";
import { ClientGameObject2D, Sprite } from "../engine/mod.ts";
import { ObstacleDef, Obstacles } from "common/scripts/definitions/obstacles.ts";
import { Camera2D, Renderer } from "../engine/renderer.ts";
import { Angle, v2 } from "common/scripts/engine/geometry.ts";
import { Debug } from "../others/config.ts";
export class Obstacle extends ClientGameObject2D{
    objectType:string="obstacle"
    numberType: number=4
    name:string=""
    def!:ObstacleDef

    sprite!:Sprite

    rotation:number=0
    variation:number=1

    zIndex=0
    create(_args: Record<string, void>): void {
        
    }
    render(camera: Camera2D, renderer: Renderer): void {
        if(this.sprite){
            renderer.draw_image2D(this.sprite,v2.sub(this.position,camera.position),v2.new(this.scale,this.scale),Angle.rad2deg(this.rotation),v2.new(0.5,0.5),this.zIndex)
            if(Debug.hitbox){
                renderer.draw_hitbox2D(this.hb,this.game.resources.get_material2D("hitbox_bullet"),camera.position)
            }
        }else{
            const spr_id=(this.def.frame&&this.def.frame.base)?this.def.frame.base:this.def.idString
            if(this.def.variations){
                this.sprite=this.game.resources.get_sprite(spr_id+`_${spr_id}`)
            }else{
                this.sprite=this.game.resources.get_sprite(spr_id)
            }
        }
    }
    update(): void {
        
    }
    constructor(){
        super()
    }
    scale=0
    updateData(data:ObstacleData){
        let position=this.position
        this.scale=data.scale
        if(data.full){
            this.def=Obstacles.getFromNumber(data.full.definition)
            position=data.full.position
            this.rotation=data.full.rotation
            this.variation=data.full.variation

            this.zIndex=this.def.zIndex??0
        }
        if(this.def.hitbox){
            this.hb=this.def.hitbox.transform(position,data.scale)
        }
    }
}