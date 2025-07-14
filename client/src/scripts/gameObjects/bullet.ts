import { BulletData } from "common/scripts/others/objectsEncode.ts";
import { Sprite2D } from "../engine/mod.ts";
import { BaseGameObject2D, CircleHitbox2D, Vec2, v2 } from "common/scripts/engine/mod.ts";
import { CATEGORYS, zIndexes } from "common/scripts/others/constants.ts";
import { Obstacle } from "./obstacle.ts";
import { Player } from "./player.ts";
import { Camera2D, ColorM, Renderer } from "../engine/renderer.ts";
import { GameObject } from "../others/gameObject.ts";
import { Debug } from "../others/config.ts";
export class Bullet extends GameObject{
    stringType:string="bullet"
    numberType: number=3
    name:string=""
    velocity:Vec2=v2.new(0,0)
    speed:number=0

    initialPosition!:Vec2
    maxDistance:number=1

    sendDelete: boolean=true;
    sprite:Sprite2D=new Sprite2D()
    create(_args: Record<string, void>) {
        this.sprite.sprite=this.game.resources.get_sprite("base_trail")
        this.game.camera.addObject(this.sprite)
    }
    override onDestroy(): void {
      this.sprite.destroy()
    }

    maxLength:number=0.3

    dying:boolean=false

    dts:Vec2=v2.new(0,0)

    private tticks:number=0
    update(dt:number): void {
        this.dts=v2.scale(this.velocity,dt)
        if(this.dying||v2.distance(this.initialPosition,this.position)>this.maxDistance){
            this.dying=true
            this.tticks-=dt
            if(this.tticks<=0){
                this.destroy()
            }
        }else{
            if(this.sprite.scale.x<this.maxLength)this.tticks+=dt
            this.manager.cells.updateObject(this)
            this.position=v2.add(this.hb.position,this.dts)

            //const objs=this.manager.cells.get_objects(this.hb,[CATEGORYS.OBSTACLES,CATEGORYS.PLAYERS])
            const objs=[...Object.values(this.manager.objects[CATEGORYS.PLAYERS].objects),...Object.values(this.manager.objects[CATEGORYS.OBSTACLES].objects)]
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

        const traveledDistance = v2.distance(this.initialPosition, this.position)

        this.sprite.scale.x=Math.min(
            Math.min(
                this.speed * this.tticks,
                traveledDistance
            ),
            this.maxLength
        );
    }
    constructor(){
        super()
        this.sprite.size=v2.new(200,10)
        this.sprite.hotspot=v2.new(1,.5)
        this.sprite.visible=false
        this.sprite.zIndex=zIndexes.Bullets
    }
    override render(camera: Camera2D, renderer: Renderer, _dt: number): void {
      if(Debug.hitbox){
            renderer.draw_hitbox2D(this.hb,this.game.resources.get_material2D("hitbox_bullet"),camera.visual_position)
        }
    }
    override updateData(data:BulletData){
        this.position=data.position
        this.tticks=data.tticks
        if(data.full){
            this.initialPosition=data.full.initialPos
            this.maxDistance=data.full.maxDistance
            this.hb=new CircleHitbox2D(data.position,data.full.radius)
            this.speed=data.full.speed
            this.sprite.rotation=data.full.angle
            this.velocity=v2.maxDecimal(v2.scale(v2.from_RadAngle(data.full.angle),this.speed),4)
            this.sprite.scale!.y=data.full.tracerHeight
            this.maxLength=data.full.tracerWidth
            this.sprite.tint=ColorM.number(data.full.tracerColor)

            this.sprite.position=this.position
            this.sprite.scale.x=0
            this.sprite.visible=true
        }
    }
}