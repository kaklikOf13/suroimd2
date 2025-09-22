import { Container2D, Sprite2D } from "../engine/mod.ts";
import { v2 } from "common/scripts/engine/geometry.ts";
import { zIndexes } from "common/scripts/others/constants.ts";
import { PlayerBodyData } from "common/scripts/others/objectsEncode.ts";
import { ColorM } from "../engine/renderer.ts";
import { random } from "common/scripts/engine/random.ts";
import { GameObject } from "../others/gameObject.ts";
import { Badges } from "common/scripts/definitions/loadout/badges.ts";
export class PlayerBody extends GameObject{
    stringType:string="player_body"
    numberType: number=8

    container:Container2D=new Container2D()
    sprite_text:Sprite2D=new Sprite2D()
    sprite_badge:Sprite2D=new Sprite2D()
    sprite:Sprite2D=new Sprite2D()

    create(args: any) {
        this.game.camera.addObject(this.container)
        this.sprite.frame=this.game.resources.get_sprite("player_body")
    }
    override onDestroy(): void {
        this.container.destroy()
        this.sprite_text.frame?.free()
    }
    update(_dt:number): void {
    }
    constructor(){
        super()
        this.sprite_text.hotspot=v2.new(0.5,0)
        this.sprite_text.position.y=0.65
        this.sprite_badge.position.y=0.65
        this.sprite_badge.hotspot=v2.new(1,0)
        this.sprite.hotspot=v2.new(0.5,0.5)
        this.container.zIndex=zIndexes.PlayersBody
        this.container.add_child(this.sprite_text)
        this.container.add_child(this.sprite_badge)
        this.container.add_child(this.sprite)
        this.container.visible=false
    }
    
    override async updateData(data:PlayerBodyData){
        if(data.full){
            switch(data.full.gore_type){
                case 0:
                    this.sprite_text.frame=await this.game.resources.render_text(`${data.full.name}`,50,"#ccc")
                    this.sprite_badge.frame=this.game.resources.get_sprite(`${Badges.getFromNumber(data.full.badge??0).idString}`)
                    this.sprite_badge.position.x=(-this.sprite_text.frame.frame_size!.x!/400)-0.1
                    break
                case 1:
                    this.sprite.frame=this.game.resources.get_sprite(`player_gore_${data.full.gore_id}`)
                    this.sprite.rotation=random.rad()
                    if(data.moving){
                        this.sprite.scale=v2.new(1,1)
                        this.game.addTween({
                            target:this.sprite.scale,
                            duration:1,
                            to:v2.new(1,1)
                        })
                    }
                    break
            }
            this.sprite.tint=ColorM.hex("#ccc")
            this.container.visible=true
        }
        if(v2.distance(this.position,data.position)<=1){
            this.position=v2.lerp(this.position,data.position,0.8)
        }else{
            this.position=data.position
        }
        this.container.position=data.position
    }
}