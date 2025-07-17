import { ClientGameObject2D, Container2D, Sprite2D } from "../engine/mod.ts";
import { v2 } from "common/scripts/engine/geometry.ts";
import { zIndexes } from "common/scripts/others/constants.ts";
import { PlayerBodyData } from "common/scripts/others/objectsEncode.ts";
import { ColorM } from "../engine/renderer.ts";
export class PlayerBody extends ClientGameObject2D{
    stringType:string="player_body"
    numberType: number=8

    container:Container2D=new Container2D()
    sprite_text:Sprite2D=new Sprite2D()
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
        this.sprite_text.hotspot=v2.new(0.5,0.5)
        this.sprite_text.position.y=0.7
        this.sprite.hotspot=v2.new(0.5,0.5)
        this.container.zIndex=zIndexes.PlayersBody
        this.container.add_child(this.sprite_text)
        this.container.add_child(this.sprite)
        this.container.visible=false
    }
    
    override async updateData(data:PlayerBodyData){
        if(data.full){
            this.sprite_text.frame=await this.game.resources.render_text(`${data.full.name}`,50,"#ccc")
            this.sprite.tint=ColorM.hex("#ccc")
            this.container.visible=true
        }
        this.position=data.position
        this.container.position=data.position
    }
}