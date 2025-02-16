import { BaseGameObject2D, Vec2 } from "common/scripts/engine/mod.ts"
import { ObstacleDef } from "common/scripts/definitions/obstacles.ts";
import { ObstacleData } from "common/scripts/others/objectsEncode.ts";
import { DamageParams } from "../others/utils.ts";

export class Obstacle extends BaseGameObject2D{
    objectType:string="obstacle"
    numberType: number=4

    def!:ObstacleDef
    _position!:Vec2

    health:number=0

    constructor(){
        super()
    }
    update(): void {

    }
    create(args: {def:ObstacleDef,position:Vec2}): void {
        this.def=args.def
        if(this.def.hitbox){
            this.hb=this.def.hitbox.transform(args.position)
            this._position=this.hb.position
        }else{
            this._position=args.position
        }
        this.health=this.def.health
    }
    getData(): ObstacleData {
        return {
            full:{
                definition:this.def.idNumber!,
                position:this._position
            },
            scale:1
        }
    }
    damage(params:DamageParams){
        this.health=Math.max(this.health-params.amount,0)
        if(this.health===0){
            this.destroy()
        }
    }
}