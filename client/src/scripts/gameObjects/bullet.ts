import { BulletData } from "common/scripts/others/objectsEncode.ts";
import { Color, FormGameObject2D, RGBA } from "../engine/mod.ts";
import { BaseGameObject2D, CircleHitbox2D, Vec2, v2 } from "common/scripts/engine/mod.ts";
import { CATEGORYS } from "common/scripts/others/constants.ts";
import { Obstacle } from "./obstacle.ts";
import { Player } from "./player.ts";
export class Bullet extends FormGameObject2D{
    color:Color
    objectType:string="bullet"
    numberType: number=3
    name:string=""
    velocity:Vec2=v2.new(0,0)

    initialPosition!:Vec2
    maxDistance:number=1000

    sendDelete: boolean=true;
    create(_args: Record<string, void>): void {
    }
    update(): void {
        if(v2.distance(this.initialPosition,this.position)>this.maxDistance){
            this.destroy()
        }
        this.position=v2.add(this.position,this.velocity)
        const objs=this.manager.cells.get_objects(this.hb,[CATEGORYS.OBSTACLES,CATEGORYS.PLAYERS])
        for(const obj of objs){
            if(this.destroyed)break
            switch((obj as BaseGameObject2D).objectType){
                case "player":
                    if((obj as Player).hb&&this.hb.collidingWith((obj as Player).hb)){
                        this.destroy()
                    }
                    break
                case "obstacle":
                    if((obj as Obstacle).def.noCollision||(obj as Obstacle).def.noBulletCollision)break
                    if((obj as Obstacle).hb&&this.hb.collidingWith((obj as Obstacle).hb)){
                        this.destroy()
                    }
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
        this.initialPosition=data.initialPos
        this.maxDistance=data.maxDistance
        this.hb=new CircleHitbox2D(data.position,data.radius)
        this.velocity=data.speed
    }
}