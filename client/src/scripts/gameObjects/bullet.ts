import { BulletData } from "common/scripts/others/objectsEncode.ts";
import { Camera2D, Container2D, Sprite2D } from "../engine/mod.ts";
import { BaseGameObject2D, CircleHitbox2D, Vec2, v2 } from "common/scripts/engine/mod.ts";
import { CATEGORYS, zIndexes } from "common/scripts/others/constants.ts";
import { Obstacle } from "./obstacle.ts";
import { type Player } from "./player.ts";
import { ColorM, Renderer } from "../engine/renderer.ts";
import { GameObject } from "../others/gameObject.ts";
import { Debug } from "../others/config.ts";
const images=[
    "bullet_normal"
]
export class Bullet extends GameObject{
    stringType:string="bullet"
    numberType: number=3
    name:string=""
    velocity:Vec2=v2.new(0,0)
    speed:number=0

    initialPosition!:Vec2
    maxDistance:number=1

    sendDelete: boolean=true;
    sprite_trail:Sprite2D=new Sprite2D()
    sprite_projectile:Sprite2D=new Sprite2D()
    container:Container2D=new Container2D()

    create(_args: Record<string, void>) {
        this.sprite_trail.frame=this.game.resources.get_sprite("base_trail")
        this.game.camera.addObject(this.container)
    }
    override onDestroy(): void {
      this.container.destroy()
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
            this.sprite_projectile.visible=false
            if(this.tticks<=0){
                this.destroy()
            }
        }else{
            if(this.sprite_trail.scale.x<this.maxLength)this.tticks+=dt
            this.manager.cells.updateObject(this)
            this.position=v2.add(this.hb.position,this.dts)

            //const objs=this.manager.cells.get_objects(this.hb,[CATEGORYS.OBSTACLES,CATEGORYS.PLAYERS])
            const objs=[...Object.values(this.manager.objects[CATEGORYS.PLAYERS].objects),...Object.values(this.manager.objects[CATEGORYS.OBSTACLES].objects)]
            for(const obj of objs){
                if(this.dying)break
                switch((obj as BaseGameObject2D).stringType){
                    case "player":
                        if((obj as Player).hb&&!(obj as Player).dead&&this.hb.collidingWith((obj as Player).hb)&&!(obj as Player).parachute){
                            (obj as Obstacle).on_hitted(this.position)
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

        this.sprite_trail.scale.x=Math.min(
            Math.min(
                this.speed * this.tticks,
                traveledDistance
            ),
            this.maxLength
        );
    }
    constructor(){
        super()
        this.sprite_trail.size=v2.new(200,10)
        this.sprite_trail.hotspot=v2.new(1,.5)
        this.sprite_trail.zIndex=1
        this.sprite_trail.position.x=0
        this.sprite_trail.position.y=0
        this.container.visible=false
        this.sprite_projectile.hotspot=v2.new(.5,.5)
        this.sprite_projectile.zIndex=2
        this.sprite_projectile.position.x=0
        this.sprite_projectile.position.y=0
        this.container.add_child(this.sprite_trail)
        this.container.add_child(this.sprite_projectile)
        this.container.updateZIndex()
        this.container.zIndex=zIndexes.Bullets
        this.sprite_projectile.visible=false
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
            this.container.rotation=data.full.angle
            this.velocity=v2.maxDecimal(v2.scale(v2.from_RadAngle(data.full.angle),this.speed),4)
            this.sprite_trail.scale!.y=data.full.tracerHeight
            this.maxLength=data.full.tracerWidth
            this.sprite_trail.tint=ColorM.number(data.full.tracerColor)

            this.container.position=this.position
            this.sprite_trail.scale.x=0

            this.sprite_projectile.scale.x=data.full.projWidth
            this.sprite_projectile.scale.y=data.full.projHeight
    
            this.sprite_projectile.tint=ColorM.number(data.full.projColor)
            if(data.full.projIMG){
                this.sprite_projectile.frame=this.game.resources.get_sprite(images[data.full.projIMG-1])
                this.sprite_projectile.visible=true
            }
            this.container.visible=true
        }
    }
}