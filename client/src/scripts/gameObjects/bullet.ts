import { BulletData } from "common/scripts/others/objectsEncode.ts";
import { Sprite } from "../engine/mod.ts";
import { Angle, BaseGameObject2D, CircleHitbox2D, Vec2, v2 } from "common/scripts/engine/mod.ts";
import { CATEGORYS } from "common/scripts/others/constants.ts";
import { Obstacle } from "./obstacle.ts";
import { Player } from "./player.ts";
import { ClientGameObject2D } from "../engine/game.ts";
import { Camera2D, Color, ColorM, Renderer } from "../engine/renderer.ts";
import { Debug } from "../others/config.ts";
export class Bullet extends ClientGameObject2D{
    stringType:string="bullet"
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
    tracerH:number=0

    dying:boolean=false
    tint!:Color

    dts:Vec2=v2.new(0,0)

    render(camera: Camera2D, renderer: Renderer,_dt:number): void {
        if(this.spr){ 
            renderer.draw_image2D(this.spr,v2.sub(this.position,camera.position),v2.new(Math.max(this.length,0),this.tracerH),Angle.rad2deg(this.angle),v2.new(1,0.5),this.tracerH,this.tint,v2.new(400,10))
            if(Debug.hitbox){
                renderer.draw_hitbox2D(this.hb,this.game.resources.get_material2D("hitbox_bullet"),camera.position)
            }
        }
    }
    private tticks:number=0

    update(dt:number): void {
        this.dts=v2.scale(this.velocity,dt)
        if(this.dying||v2.distance(this.initialPosition,this.position)>this.maxDistance){
            this.dying=true
            if(this.length<=0){
                this.destroy()
            }
        }else{
            this.manager.cells.updateObject(this)
            this.hb.position=v2.add(this.hb.position,this.dts)
        }

        const traveledDistance = v2.distance(this.initialPosition, this.position)

        if(this.dying){
            this.tticks-=dt
            if(this.length<=0){
                this.destroy()
            }
        }else{
            this.tticks+=dt/2
        }
        this.length=Math.min(
            Math.min(
                this.speed * this.tticks,
                traveledDistance
            ),
            this.maxLength
        );
        
        const objs=this.manager.cells.get_objects(this.hb,[CATEGORYS.OBSTACLES,CATEGORYS.PLAYERS])
        for(const obj of objs){
            if(this.dying)break
            switch((obj as BaseGameObject2D).stringType){
                case "player":
                    if((obj as Player).hb&&this.hb.collidingWith((obj as Player).hb)){
                        this.dying=true
                    }
                    break
                case "obstacle":
                    if((obj as Obstacle).def.noBulletCollision)break
                    if((obj as Obstacle).hb&&this.hb.collidingWith((obj as Obstacle).hb)){
                        (obj as Obstacle).on_hitted(v2.duplicate(this.position))
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
        this.velocity=v2.maxDecimal(v2.scale(v2.from_RadAngle(this.angle),this.speed),4)
        this.tracerH=data.tracerHeight
        this.maxLength=data.tracerWidth
        this.tint=ColorM.number(data.tracerColor)
    }
}