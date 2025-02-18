import { ObstacleData } from "common/scripts/others/objectsEncode.ts";
import { ClientGameObject2D, Sprite } from "../engine/mod.ts";
import { ObstacleDef, Obstacles } from "common/scripts/definitions/obstacles.ts";
import { Camera2D, Renderer } from "../engine/renderer.ts";
import { v2 } from "common/scripts/engine/geometry.ts";
export class Obstacle extends ClientGameObject2D{
    objectType:string="obstacle"
    numberType: number=4
    name:string=""
    def!:ObstacleDef

    sprite!:Sprite
    create(_args: Record<string, void>): void {
        
    }
    render(camera: Camera2D, renderer: Renderer): void {
        if(this.sprite){
            renderer.draw_image2D(this.sprite,v2.sub(this.position,camera.position),v2.new(this.scale,this.scale),0,v2.new(0.5,0.5))
        }else{
            if(this.def.frame&&this.def.frame.base){
                this.sprite=this.game.resources.get_sprite(this.def.frame.base)
            }else{
                this.sprite=this.game.resources.get_sprite(this.def.idString)
                //document.body.appendChild(this.sprite.source)
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
        }
        if(this.def.hitbox){
            this.hb=this.def.hitbox.transform(position,data.scale)
        }
    }
}