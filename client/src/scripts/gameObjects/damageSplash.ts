import { Sprite } from "../engine/mod.ts";
import { Camera2D, Renderer } from "../engine/renderer.ts";
import {Vec2, v2 } from "common/scripts/engine/geometry.ts";
import { Sound } from "../engine/resources.ts";
import { GameObject } from "../others/gameObject.ts";
export class DamageSplash extends GameObject{
    stringType:string="damage_splash"
    numberType: number=7

    sprite!:Sprite

    async create(args: {position:Vec2,count:number,critical:boolean,shield:boolean}): Promise<void> {
        const color=args.shield?(args.critical?"#0f9":"#114"):(args.critical?"#f00":"#ff0")
        this.sprite=await this.game.resources.render_text(`${args.count}`,50,color)
        this.position=v2.duplicate(args.position)
        this.lifetime+=Math.random()
    }

    scale:number=0

    sounds?:{
        break?:Sound
        hit?:Sound[]
    }

    lifetime:number=1.2

    render(camera: Camera2D, renderer: Renderer): void {
        if(this.sprite){
            renderer.draw_image2D(this.sprite,v2.sub(this.position,camera.position),v2.new(this.scale,this.scale),this.angle,v2.new(0.5,0.5))
        }
    }
    onDestroy(): void {
        this.sprite.free()
    }
    dying:boolean=false
    angle=0
    update(dt:number): void {
        this.lifetime-=dt
        if(this.lifetime<=0){
            this.dying=true
        }
        if(this.dying){
            this.scale-=3*dt
            this.angle+=100*dt
            if(this.scale<=0){
                this.destroy()
            }
        }else if(this.scale<=1){
            this.scale+=3*dt
            this.position.y-=1.5*dt
        }else{
            this.scale=1
            this.position.y-=0.025*dt
        }
    }
    constructor(){
        super()
    }
}