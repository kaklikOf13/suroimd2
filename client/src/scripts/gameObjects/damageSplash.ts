import { ClientGameObject2D, Sprite2D } from "../engine/mod.ts";
import {Vec2, v2 } from "common/scripts/engine/geometry.ts";
import { Sound } from "../engine/resources.ts";
export class DamageSplash extends ClientGameObject2D{
    stringType:string="damage_splash"
    numberType: number=7

    sprite:Sprite2D

    async create(args: {position:Vec2,count:number,critical:boolean,shield:boolean}): Promise<void> {
        const color=args.shield?(args.critical?"#0f9":"#114"):(args.critical?"#f00":"#ff0")
        this.sprite.sprite=await this.game.resources.render_text(`${args.count}`,50,color)
        this.position=v2.duplicate(args.position)
        this.lifetime+=Math.random()
        this.sprite.position=this.position
        this.game.camera.addObject(this.sprite)
    }

    sounds?:{
        break?:Sound
        hit?:Sound[]
    }

    lifetime:number=1.2

    override onDestroy(): void {
        this.sprite.destroy()
    }
    dying:boolean=false
    update(dt:number): void {
        this.lifetime-=dt
        if(this.lifetime<=0){
            this.dying=true
        }
        if(this.dying){
            this.sprite.scale.x-=3*dt
            this.sprite.scale.y-=3*dt
            if(this.sprite.scale.x<=0){
                this.destroy()
            }
        }else if(this.sprite.scale.x<=1){
            this.sprite.scale.x+=3*dt
            this.sprite.scale.y+=3*dt
            this.position.y-=1.5*dt
        }else{
            this.sprite.scale.x=1
            this.sprite.scale.y=1
            this.position.y-=0.025*dt
        }
    }
    constructor(){
        super()
        this.sprite=new Sprite2D()
        this.sprite.hotspot=v2.new(0.5,0.5)
        this.sprite.scale.x=0
        this.sprite.scale.y=0
    }
}