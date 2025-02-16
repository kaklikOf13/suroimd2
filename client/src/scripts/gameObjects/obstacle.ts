import { ObstacleData } from "common/scripts/others/objectsEncode.ts";
import { Color, FormGameObject2D, RGBA } from "../engine/mod.ts";
import { ObstacleDef, Obstacles } from "common/scripts/definitions/obstacles.ts";
export class Obstacle extends FormGameObject2D{
    color:Color
    objectType:string="obstacle"
    numberType: number=4
    name:string=""
    def!:ObstacleDef
    create(_args: Record<string, void>): void {
        this.color=RGBA.new(0,20,150)
    }
    update(): void {
        
    }
    constructor(){
        super()
        this.color=RGBA.new(100,0,0)
    }
    updateData(data:ObstacleData){
        let position=this.position
        if(data.full){
            this.def=Obstacles.getFromNumber(data.full.definition)
            position=data.full.position
        }
        if(this.def.hitbox){
            this.hb=this.def.hitbox.transform(position,data.scale)
        }
    }
}