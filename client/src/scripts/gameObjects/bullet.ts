import { BulletData } from "common/scripts/others/objectsEncode.ts";
import { Sprite } from "../engine/mod.ts";
import { BaseGameObject2D, CircleHitbox2D, Vec2, v2 } from "common/scripts/engine/mod.ts";
import { CATEGORYS } from "common/scripts/others/constants.ts";
import { Obstacle } from "./obstacle.ts";
import { Player } from "./player.ts";
import { Color, ColorM } from "../engine/renderer.ts";
import { Debug } from "../others/config.ts";
import { GameObject } from "../others/gameObject.ts";
export class Bullet extends GameObject{
    stringType:string="bullet"
    numberType: number=3
    name:string=""
    velocity:Vec2=v2.new(0,0)
    angle:number=0
    speed:number=0

    initialPosition!:Vec2
    maxDistance:number=1

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
            this.position=v2.add(this.hb.position,this.dts)
        }

        const traveledDistance = v2.distance(this.initialPosition, this.position)

        if(this.dying){
            this.tticks-=dt*2.5
            if(this.tticks<=0){
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
                    if((obj as Obstacle).def.noBulletCollision||(obj as Obstacle).dead)break
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