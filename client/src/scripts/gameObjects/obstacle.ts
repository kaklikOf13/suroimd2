import { ObstacleData } from "common/scripts/others/objectsEncode.ts";
import { ClientGameObject2D, Sprite } from "../engine/mod.ts";
import { Materials, ObstacleDef, Obstacles } from "common/scripts/definitions/obstacles.ts";
import { Camera2D, Renderer } from "../engine/renderer.ts";
import { Angle, v2 } from "common/scripts/engine/geometry.ts";
import { Debug } from "../others/config.ts";
import { Particles2DBase } from "common/scripts/engine/particles.ts";
import { random } from "common/scripts/engine/random.ts";
import { Vec2 } from "common/scripts/engine/mod.ts";
import { Sound } from "../engine/resources.ts";
export class Obstacle extends ClientGameObject2D{
    stringType:string="obstacle"
    numberType: number=4
    name:string=""
    def!:ObstacleDef

    sprite!:Sprite

    rotation:number=0
    variation:number=1

    zIndex=0
    create(_args: Record<string, void>): void {
        
    }

    sounds?:{
        break?:Sound
        hit?:Sound[]
    }
    render(camera: Camera2D, renderer: Renderer): void {
        if(this.sprite){
            renderer.draw_image2D(this.sprite,v2.sub(this.position,camera.position),v2.new(this.scale,this.scale),Angle.rad2deg(this.rotation),v2.new(0.5,0.5),this.zIndex)
            if(Debug.hitbox){
                renderer.draw_hitbox2D(this.hb,this.game.resources.get_material2D("hitbox_bullet"),camera.position)
            }
        }else{
            const spr_id=(this.def.frame&&this.def.frame.base)?this.def.frame.base:this.def.idString
            if(this.def.variations){
                this.sprite=this.game.resources.get_sprite(spr_id+`_${spr_id}`)
            }else{
                this.sprite=this.game.resources.get_sprite(spr_id)
            }
        }
    }
    onDestroy(): void {
        for(let i=0;i<5;i++){
            this._add_own_particle(this.hb.randomPoint())
        }
        if(this.sounds&&this.sounds.break){
            this.game.sounds.play(this.sounds.break,{})
        }
    }
    _add_own_particle(position:Vec2){
        this.game.particles.add_particle(position,random.rad(),{lifetime:random.float(0.6,0.7),speed:0.05,angular_speed:Angle.deg2rad(random.int(-1,1))},Particles2DBase.life_timed1)
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
        if(data.full){
            this.def=Obstacles.getFromNumber(data.full.definition)
            position=data.full.position
            this.rotation=data.full.rotation
            this.variation=data.full.variation

            this.zIndex=this.def.zIndex??0

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
        }
        if(this.def.hitbox){
            this.hb=this.def.hitbox.transform(position,data.scale)
        }
    }
}