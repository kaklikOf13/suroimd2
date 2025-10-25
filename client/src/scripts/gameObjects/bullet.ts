import { BulletData } from "common/scripts/others/objectsEncode.ts";
import { ABParticle2D, Camera2D, Container2D, Sprite2D } from "../engine/mod.ts";
import { BaseGameObject2D, CircleHitbox2D, Vec2, random, v2, v2m } from "common/scripts/engine/mod.ts";
import { zIndexes } from "common/scripts/others/constants.ts";
import { Obstacle } from "./obstacle.ts";
import { type Player } from "./player.ts";
import { ColorM, Renderer } from "../engine/renderer.ts";
import { GameObject } from "../others/gameObject.ts";
import { Creature } from "./creature.ts";
const images=[
    "bullet_normal",
    "bullet_rocket"
]
const particles=[
    "gas_smoke_particle"
]
export class Bullet extends GameObject{
    stringType:string="bullet"
    numberType: number=3
    name:string=""
    velocity:Vec2=v2.new(0,0)
    speed:number=0

    initialPosition!:Vec2
    maxDistance:number=1

    old_position:Vec2=v2.new(0,0)

    sendDelete: boolean=true;
    sprite_trail:Sprite2D=new Sprite2D()
    sprite_projectile?:Sprite2D=new Sprite2D()
    container:Container2D=new Container2D()

    create(_args: Record<string, void>) {
        this.sprite_trail.frame=this.game.resources.get_sprite("base_trail")
        this.game.camera.addObject(this.container)
    }
    override on_destroy(): void {
      this.container.destroy()
    }

    maxLength:number=0.3

    dying:boolean=false

    dts:Vec2=v2.new(0,0)

    particles=0
    par_time=0

    critical:boolean=false

    private tticks:number=0
    update(dt:number): void {
        this.dts=v2.scale(this.velocity,dt)
        if(this.dying||v2.distance(this.initialPosition,this.position)>this.maxDistance){
            this.dying=true
            this.tticks-=dt
            this.sprite_projectile?.destroy()
            if(this.tticks<=0){
                this.destroy()
            }
        }else{
            if(this.sprite_trail.scale.x<this.maxLength)this.tticks+=dt
            this.manager.cells.updateObject(this)
            v2m.add(this.hb.position,this.hb.position,this.dts)

            const objs=this.manager.cells.get_objects(this.hb,this.layer)
            for(const obj of objs){
                if(this.dying)break
                switch((obj as BaseGameObject2D).stringType){
                    case "player":
                        if((obj as Player).hb&&!(obj as Player).dead&&(this.hb.collidingWith(obj.hb)||obj.hb.colliding_with_line(this.old_position,this.position))&&!(obj as Player).parachute){
                            (obj as Player).on_hitted(this.position,this.critical)
                            this.dying=true
                        }
                        break
                    case "creature":
                        if((obj as Creature).hb&&!(obj as Creature).dead&&(this.hb.collidingWith(obj.hb)||obj.hb.colliding_with_line(this.old_position,this.position))){
                            this.dying=true
                        }
                        break
                    case "obstacle":
                        if((obj as Obstacle).def.noBulletCollision||(obj as Obstacle).dead)break
                        if(obj.hb&&(this.hb.collidingWith(obj.hb)||obj.hb.colliding_with_line(this.old_position,this.position))){
                            (obj as Obstacle).on_hitted(this.position)
                            this.dying=true
                        }
                        break
                }
            }

            if(this.particles>0){
                this.par_time-=dt
                if(this.par_time<=0){
                    const p=new ABParticle2D({
                        direction:random.rad(),
                        life_time:0.9,
                        position:this.position,
                        frame:{
                            image:particles[this.particles-1],
                            hotspot:v2.new(.5,.5)
                        },
                        speed:random.float(0.5,1.2),
                        angle:0,
                        scale:0.1,
                        tint:ColorM.hex("#fff5"),
                        to:{
                            tint:ColorM.hex("#fff0"),
                            scale:1
                        }
                    })
                    this.game.particles.add_particle(p)
                    this.par_time=0.01
                }
            }

            this.old_position=v2.duplicate(this.position)
            this.container.position=this.position
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
        this.container.add_child(this.sprite_trail)
        this.container.updateZIndex()
        this.container.zIndex=zIndexes.Bullets
    }
    override render(camera: Camera2D, renderer: Renderer, _dt: number): void {
      /*if(Debug.hitbox){
            renderer.draw_hitbox2D(this.hb,this.game.resources.get_material2D("hitbox_bullet"),camera.visual_position)
        }*/
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
            this.velocity=v2.from_RadAngle(data.full.angle)
            v2m.scale(this.velocity,this.velocity,this.speed)
            this.sprite_trail.scale!.y=data.full.tracerHeight
            this.maxLength=data.full.tracerWidth
            this.sprite_trail.tint=ColorM.number(data.full.tracerColor)

            this.sprite_trail.scale.x=0

            if(data.full.projIMG){
                this.sprite_projectile=new Sprite2D()
                this.sprite_projectile.hotspot=v2.new(.5,.5)
                this.sprite_projectile.zIndex=2
                this.sprite_projectile.position.x=0
                this.sprite_projectile.position.y=0
                this.sprite_projectile.scale.x=data.full.projWidth
                this.sprite_projectile.scale.y=data.full.projHeight

                this.sprite_projectile.tint=ColorM.number(data.full.projColor)
                this.sprite_projectile.frame=this.game.resources.get_sprite(images[data.full.projIMG-1])

                this.container.add_child(this.sprite_projectile)
            }
            this.particles=data.full.projParticle
            this.container.visible=true
            this.critical=data.full.critical
        }
    }
}