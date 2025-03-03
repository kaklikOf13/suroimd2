import { BulletData } from "common/scripts/others/objectsEncode.ts";
import { Sprite } from "../engine/mod.ts";
import { Angle, BaseGameObject2D, CircleHitbox2D, Vec2, v2 } from "common/scripts/engine/mod.ts";
import { CATEGORYS } from "common/scripts/others/constants.ts";
import { Obstacle } from "./obstacle.ts";
import { Player } from "./player.ts";
import { ClientGameObject2D } from "../engine/game.ts";
import { Camera2D, Renderer } from "../engine/renderer.ts";
import { Debug } from "../others/config.ts";
export class Bullet extends ClientGameObject2D{
    objectType:string="bullet"
    numberType: number=3
    name:string=""
    velocity:Vec2=v2.new(0,0)
    angle:number=0
    speed:number=0

    initialPosition!:Vec2
    maxDistance:number=1000

    sendDelete: boolean=true;
    spr!:Sprite
    create(_args: Record<string, void>) {
        this.spr=this.game.resources.get_sprite("base_trail")
    }

    length:number=0
    maxLength:number=0.3
    visualPos!:Vec2
    savedPos:Vec2=v2.new(0,0)
    tracerH:number=0

    dying:boolean=false

    render(camera: Camera2D, renderer: Renderer): void {
        if(this.dying){
            this.length=Math.max(this.length-(this.speed/6),0)
        }else{
            if(this.length<this.maxLength){
                this.length+=this.speed/5
                this.visualPos=v2.add(this.visualPos,this.velocity)
                this.savedPos=v2.sub(this.position,this.visualPos)
            }else{
                this.length=this.maxLength
                this.visualPos=v2.sub(this.position,this.savedPos)
            }
        }
        if(this.spr){
            renderer.draw_image2D(this.spr,v2.sub(this.visualPos,camera.position),v2.new(this.length,this.tracerH),Angle.rad2deg(this.angle),v2.new(1,0.5))
            if(Debug.hitbox){
                renderer.draw_hitbox2D(this.hb,this.game.resources.get_material2D("hitbox_bullet"),camera.position)
            }
        }
    }
    update(): void {
        if(this.dying||v2.distance(this.initialPosition,this.position)>this.maxDistance){
            this.dying=true
            if(this.length<=0){
                this.destroy()
            }
        }else{
            this.position=v2.add(this.position,this.velocity)
        }
        const objs=this.manager.cells.get_objects(this.hb,[CATEGORYS.OBSTACLES,CATEGORYS.PLAYERS])
        for(const obj of objs){
            if(this.dying||this.destroyed)break
            switch((obj as BaseGameObject2D).objectType){
                case "player":
                    if((obj as Player).hb&&this.hb.collidingWith((obj as Player).hb)){
                        this.dying=true
                    }
                    break
                case "obstacle":
                    if((obj as Obstacle).def.noBulletCollision)break
                    if((obj as Obstacle).hb&&this.hb.collidingWith((obj as Obstacle).hb)){
                        this.dying=true
                    }
                    break
            }
        }
    }
    constructor(){
        super()
    }
    updateData(data:BulletData){
        this.position=data.position
        this.initialPosition=data.initialPos
        this.maxDistance=data.maxDistance
        this.hb=new CircleHitbox2D(data.position,data.radius)
        this.speed=data.speed
        this.angle=data.angle
        this.velocity=v2.scale(v2.from_RadAngle(this.angle),this.speed)
        this.tracerH=data.tracer.height
        this.maxLength=data.tracer.width
        this.visualPos=v2.duplicate(this.position)
    }
}