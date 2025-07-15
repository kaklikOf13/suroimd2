import { ClientGameObject2D, Sprite2D } from "../engine/mod.ts";
import {Vec2, v2 } from "common/scripts/engine/geometry.ts";
import { Sound } from "../engine/resources.ts";
import { zIndexes } from "common/scripts/others/constants.ts";
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
        this.sprite.scale.x=0
        this.sprite.scale.y=0
        this.game.addTween({
            duration:0.4,
            target:this.sprite.scale,
            to:{x:1,y:1}
        })
        this.game.addTween({
            duration:1,
            target:this.sprite.position,
            to:v2.add(this.sprite.position,v2.new(0,-1)),
        })
        this.sprite.rotation=-.4
        this.game.addTween({
            duration:0.8,
            target:this.sprite,
            to:{rotation:.4},
            infinite:true,
            yoyo:true
        })
        this.game.camera.addObject(this.sprite)
    }

    sounds?:{
        break?:Sound
        hit?:Sound[]
    }

    lifetime:number=2

    override onDestroy(): void {
        this.sprite.destroy()
    }
    dying:boolean=false
    can_die:boolean=true
    update(dt:number): void {
        this.lifetime-=dt
        if(this.lifetime<=0){
            this.dying=true
        }
        if(this.dying&&this.can_die){
            this.can_die=false
            // deno-lint-ignore no-this-alias
            const This=this
            this.game.addTween({
                duration:1,
                target:this.sprite.scale,
                to:{x:0,y:0},
                onComplete(){
                    This.destroy()
                }
            })
        }
    }
    constructor(){
        super()
        this.sprite=new Sprite2D()
        this.sprite.hotspot=v2.new(0.5,0.5)
        this.sprite.scale.x=0
        this.sprite.scale.y=0
        this.sprite.zIndex=zIndexes.DamageSplashs
    }
}