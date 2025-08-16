import { ObstacleData } from "common/scripts/others/objectsEncode.ts";
import { ABParticle2D, type Camera2D, ClientGameObject2D, type ClientParticle2D, ColorM, Container2D, type Renderer, Sprite2D } from "../engine/mod.ts";
import { Materials, ObstacleDef, Obstacles } from "common/scripts/definitions/objects/obstacles.ts";
import { random } from "common/scripts/engine/random.ts";
import { ParticlesEmitter2D, Vec2 } from "common/scripts/engine/mod.ts";
import { Sound } from "../engine/resources.ts";
import { v2 } from "common/scripts/engine/geometry.ts";
import { zIndexes } from "common/scripts/others/constants.ts";
import { Debug, GraphicsParticlesConfig } from "../others/config.ts";
export class Obstacle extends ClientGameObject2D{
    stringType:string="obstacle"
    numberType: number=4
    name:string=""
    def!:ObstacleDef

    container:Container2D=new Container2D()
    sprite=new Sprite2D
    variation=0

    dead:boolean=true

    frame={
        particle:"",
        dead:"",
        base:""
    }

    emitter_1?:ParticlesEmitter2D<ClientParticle2D>
    create(_args: Record<string, void>): void {
        this.game.camera.addObject(this.container)
    }

    sounds?:{
        break?:Sound
        hit?:Sound[]
    }
    override onDestroy(): void {
        this.container.destroy()
        if(this.emitter_1)this.emitter_1.destroyed=true
    }
    update_frame(){
        if(this.def.frame_transform)this.sprite.transform_frame(this.def.frame_transform)
        if(this.dead){
            this.sprite.frame=this.game.resources.get_sprite(this.frame.dead)
            this.container.zIndex=zIndexes.DeadObstacles
            if(this.emitter_1)this.emitter_1.destroyed=true
        }else{
            this.sprite.frame=this.game.resources.get_sprite(this.frame.base)
            this.container.zIndex=this.def.zIndex??zIndexes.Obstacles1
        }
        this.container.visible=true
    }
    die(){
        if(this.dead)return
        this.dead=true
        this.update_frame()
        const ac=random.int(8,13)
        if(this.emitter_1)this.emitter_1.enabled=false
        if(this.game.save.get_variable("cv_graphics_particles")>=GraphicsParticlesConfig.Normal){
            for(let i=0;i<ac;i++){
                this._add_own_particle(this.hb.randomPoint(),2)
            }
        }
        if(this.sounds&&this.sounds.break){
            this.game.sounds.play(this.sounds.break,{
                position:this.position,
                max_distance:13
            })
        }
    }
    _add_own_particle(position:Vec2,force:number=1){
        const p=new ABParticle2D({
            frame:{
                image:this.frame.particle
            },
            position,
            speed:random.float(1,2)*force,
            angle:random.float(-3.1415,3.1415),
            direction:random.float(-3.1415,3.1415),
            life_time:random.float(1,2),
            zIndex:zIndexes.Particles,
            scale:random.float(0.5,1),
            to:{
                speed:random.float(0.1,1),
                angle:random.float(-3.1415,3.1415),
            }
        })
        this.game.particles.add_particle(p)
    }
    update(_dt:number): void {
        
    }
    on_hitted(position:Vec2){
        if(this.game.save.get_variable("cv_graphics_particles")>=GraphicsParticlesConfig.Normal)this._add_own_particle(position)
        if(this.sounds&&this.sounds.hit&&this.sounds.hit.length>0){
            this.game.sounds.play(this.sounds.hit[random.int(0,this.sounds.hit.length)],{
                volume:1,
                position:this.position,
                max_distance:14
            },"obstacles")
        }
    }
    override render(camera: Camera2D, renderer: Renderer, _dt: number): void {
        if(Debug.hitbox){
            renderer.draw_hitbox2D(this.hb,this.game.resources.get_material2D("hitbox_obstacle"),camera.visual_position)
        }
    }
    constructor(){
        super()
        this.container.visible=false
        this.container.add_child(this.sprite)
        this.sprite.hotspot=v2.new(.5,.5)
    }
    scale=0
    override updateData(data:ObstacleData){
        let position=this.position
        this.scale=data.scale
        this.container.scale=v2.new(this.scale,this.scale)
        if(data.full){
            this.def=Obstacles.getFromNumber(data.full.definition)
            position=data.full.position
            this.container.rotation=data.full.rotation
            this.container.position=data.full.position
            this.variation=data.full.variation

            if(this.def.sounds){
                this.sounds={
                    break:this.game.resources.get_audio(this.def.sounds.break),
                    hit:[]
                }
                if(this.def.sounds.hit_variations){
                    for(let i=1;i<=this.def.sounds.hit_variations;i++){
                        this.sounds.hit!.push(this.game.resources.get_audio(this.def.sounds.hit+`_${i}`))
                    }
                }else{
                    this.game.resources.get_audio(this.def.sounds.hit)
                }
            }else if(this.def.material){
                const mat=Materials[this.def.material]
                this.sounds={
                    break:this.game.resources.get_audio(mat.sounds+"_break"),
                    hit:[]
                }
                if(mat.hit_variations){
                    for(let i=1;i<=mat.hit_variations;i++){
                        this.sounds.hit!.push(this.game.resources.get_audio(mat.sounds+`_hit_${i}`))
                    }
                }else{
                    this.game.resources.get_audio(mat.sounds+"_hit")
                }
            }
            const spr_id=(this.def.frame&&this.def.frame.base)?this.def.frame.base:this.def.idString
            if(this.def.variations){
                this.frame.base=spr_id+`_${this.variation}`
            }else{
                this.frame.base=spr_id
            }
            this.frame.particle=(this.def.frame?.particle)??this.def.idString+"_particle"
            this.frame.dead=(this.def.frame&&this.def.frame.dead)?this.def.frame.dead:this.def.idString+"_dead"

            if(this.def.onDestroyExplosion&&this.game.save.get_variable("cv_graphics_particles")>=GraphicsParticlesConfig.Advanced){
                if(!this.emitter_1){
                    this.emitter_1=this.game.particles.add_emiter({
                        delay:0.3,
                        particle:()=>new ABParticle2D({
                            frame:{
                                image:"gas_smoke_particle"
                            },
                            position:this.position,
                            speed:random.float(0.7,1),
                            angle:0,
                            direction:random.float(-1.45,-1.65),
                            life_time:random.float(1.7,3),
                            zIndex:zIndexes.Particles,
                            scale:0,
                            tint:ColorM.hex("#ffffffdd"),
                            to:{scale:random.float(0.7,1.2),tint:ColorM.hex("#ffffff00")}
                        }),
                        enabled:data.health<=0.35,
                    })
                }
            }
        }
        if(data.dead){
            if(this.emitter_1)this.emitter_1.enabled=false
            this.die()
        }else if(this.dead){
            this.dead=false
        }else{
            if(this.emitter_1&&data.health<=0.35){
                this.emitter_1.enabled=true
            }
        }
        if(!this.container.visible){
            this.update_frame()
        }
        if(this.def.hitbox){
            this.hb=this.def.hitbox.transform(position,data.scale)
            this.container.position=this.hb.position
            this.manager.cells.updateObject(this)
        }
    }
}