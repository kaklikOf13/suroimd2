import { ObstacleData } from "common/scripts/others/objectsEncode.ts";
import { Materials, ObstacleDef, Obstacles } from "common/scripts/definitions/obstacles.ts";
import { Angle, v2 } from "common/scripts/engine/geometry.ts";
import { Debug } from "../others/config.ts";
import { random } from "common/scripts/engine/random.ts";
import { Vec2 } from "common/scripts/engine/mod.ts";
import { Sound } from "../engine/resources.ts";
import { zIndexes } from "common/scripts/others/constants.ts";
import { Particles } from "../defs/particles.ts";
import { GameObject } from "../others/gameObject.ts";
import * as PIXI from "pixi.js"
export class Obstacle extends GameObject{
    stringType:string="obstacle"
    numberType: number=4
    name:string=""
    def!:ObstacleDef

    rotation:number=0
    variation:number=1
    create(_args: Record<string, void>): void {
        this.sprite=new PIXI.Sprite()
        this.sprite.anchor.set(0.5)
        this.container=new PIXI.Container()
        this.container.addChild(this.sprite)
        this.game.camera.addObject(this.container!)
    }

    dead:boolean=false

    sounds?:{
        break?:Sound
        hit?:Sound[]
    }
    hotspot=v2.new(0.5,0.5)
    sprite!:PIXI.Sprite
    onDie(): void {
        for(let i=0;i<5;i++){
            this._add_own_particle(this.hb.randomPoint())
        }
        this.container!.zIndex=zIndexes.DeadObstacles

        if(this.sounds&&this.sounds.break){
            this.game.sounds.play(this.sounds.break,{})
        }
        const spr_id=(this.def.frame&&this.def.frame.base)?this.def.frame.base:this.def.idString
            this.sprite.texture=this.game.resources.get_sprite(spr_id+"_dead").texture
    }
    onDestroy(): void {
        this.sprite.destroy()
        this.container?.destroy()
    }
    _add_own_particle(position:Vec2){
        if(this.def.particle&&Particles.exist(this.def.particle))this.game.particles.add_particle_with_def(position,this.rotation,Particles.getFromString(this.def.particle))
    }
    update(_dt:number): void {
        
    }
    on_hitted(position:Vec2){
        this._add_own_particle(position)
        if(this.sounds&&this.sounds.hit&&this.sounds.hit.length>0){
            this.game.sounds.play(this.sounds.hit[random.int(0,this.sounds.hit.length)],{})
        }
    }
    constructor(){
        super()
    }
    scale=0
    updateData(data:ObstacleData){
        let position=this.position
        this.scale=data.scale
        if(!this.dead&&data.dead){
            this.onDie()
        }
        this.dead=data.dead
        if(data.full){
            this.def=Obstacles.getFromNumber(data.full.definition)
            position=data.full.position
            this.rotation=data.full.rotation
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
            if(this.def.hotspot){
                this.hotspot=this.def.hotspot
            }
            if(!this.dead){
                const spr_id=(this.def.frame&&this.def.frame.base)?this.def.frame.base:this.def.idString
                if(this.def.variations){
                    this.sprite.texture=this.game.resources.get_sprite(spr_id+`_${this.variation}`).texture
                }else{
                    this.sprite.texture=this.game.resources.get_sprite(spr_id).texture
                }
            }
            this.container?.position.set(position.x,position.y)
            this.sprite.anchor.set(this.hotspot.x,this.hotspot.y)
            this.container!.zIndex=this.def.zIndex??zIndexes.Obstacles1
        }
        if(this.def&&this.def.hitbox){
            this.hb=this.def.hitbox.transform(position,data.scale)
            this.manager.cells.updateObject(this)
        }
    }
}