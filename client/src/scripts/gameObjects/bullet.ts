import { BulletData } from "common/scripts/others/objectsEncode.ts";
import { Color, FormGameObject2D, RGBA } from "../engine/mod.ts";
import { CircleHitbox2D, Vec2, v2 } from "common/scripts/engine/mod.ts";
import { CATEGORYS } from "common/scripts/others/constants.ts";
import { Obstacle } from "./obstacle.ts";
export class Bullet extends FormGameObject2D{
    color:Color
    objectType:string="bullet"
    numberType: number=3
    name:string=""
    velocity:Vec2=v2.new(0,0)
    create(_args: Record<string, void>): void {
    }
    update(): void {
        this.position=v2.add(this.position,this.velocity)
        const objs=this.manager.cells.get_objects(this.hb,[CATEGORYS.OBSTACLES])
        for(const obs of objs){
            if((obs as Obstacle).hb&&this.hb.collidingWith((obs as Obstacle).hb)){
                this.destroy()
                break
            }
        }
    }
    constructor(){
        super()
        this.color=RGBA.new(0,0,0)
    }
    updateData(data:BulletData){
        this.position=data.position
        this.hb=new CircleHitbox2D(data.position,data.radius)
        this.velocity=data.speed
    }
}