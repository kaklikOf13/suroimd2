import { ObstacleData } from "common/scripts/others/objectsEncode.ts";
import { ClientGameObject2D, Container2D, Sprite2D } from "../engine/mod.ts";
import { Materials, ObstacleDef, Obstacles } from "common/scripts/definitions/obstacles.ts";
import { random } from "common/scripts/engine/random.ts";
import { Vec2 } from "common/scripts/engine/mod.ts";
import { Sound } from "../engine/resources.ts";
import { v2 } from "common/scripts/engine/geometry.ts";
import { zIndexes } from "common/scripts/others/constants.ts";
export class Obstacle extends ClientGameObject2D{
    stringType:string="obstacle"
    numberType: number=4
    name:string=""
    def!:ObstacleDef

    container:Container2D=new Container2D()
    sprite=new Sprite2D
    variation=0

    dead:boolean=false

    create(_args: Record<string, void>): void {
        this.game.camera.addObject(this.container)
    }

    sounds?:{
        break?:Sound
        hit?:Sound[]
    }
    override onDestroy(): void {
        /*for(let i=0;i<5;i++){
            this._add_own_particle(this.hb.randomPoint())
        }*/
        /*if(this.sounds&&this.sounds.break){
            this.game.sounds.play(this.sounds.break,{})
        }*/
        this.container.destroy()
    }
    /*_add_own_particle(position:Vec2){
        this.game.particles.add_particle(position,random.rad(),{lifetime:random.float(0.6,0.7),speed:0.05,angular_speed:Angle.deg2rad(random.int(-1,1))},Particles2DBase.life_timed1)
    }*/
    update(_dt:number): void {
        
    }
    on_hitted(position:Vec2){
        //this._add_own_particle(position)
        if(this.sounds&&this.sounds.hit&&this.sounds.hit.length>0){
            this.game.sounds.play(this.sounds.hit[random.int(0,this.sounds.hit.length)],{})
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

            this.container.zIndex=this.def.zIndex??0

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
                this.sprite.sprite=this.game.resources.get_sprite(spr_id+`_${this.variation}`)
            }else{
                this.sprite.sprite=this.game.resources.get_sprite(spr_id)
            }

            this.container.visible=true
        }
        if(data.dead&&!this.dead){
            this.dead=data.dead
            const spr_id=(this.def.frame&&this.def.frame.dead)?this.def.frame.dead:this.def.idString
            this.sprite.sprite=this.game.resources.get_sprite(spr_id+`_dead`)
            this.container.zIndex=zIndexes.DeadObstacles
        }
        if(this.def.hitbox){
            this.hb=this.def.hitbox.transform(position,data.scale)
            this.container.position=this.hb.position
            this.manager.cells.updateObject(this)
        }
    }
}