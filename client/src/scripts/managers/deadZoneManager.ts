import { v2, Vec2 } from "common/scripts/engine/geometry.ts";
import { type Game } from "../others/game.ts";
import { zIndexes } from "common/scripts/others/constants.ts";
import { Graphics2D } from "../engine/mod.ts";
import { model2d } from "common/scripts/engine/models.ts";
import { Color, ColorM } from "../engine/renderer.ts";
import { Numeric } from "common/scripts/engine/utils.ts";
import { DeadZoneUpdate } from "common/scripts/packets/update_packet.ts";
export class DeadZoneManager{
    radius:number=5
    position:Vec2=v2.new(0,0)

    sprite:Graphics2D=new Graphics2D()
    game:Game
    constructor(game:Game){
        this.game=game
        this.sprite.zIndex=zIndexes.DeadZone
        this.sprite.scale=v2.new(1,1)
        this.game.camera.addObject(this.sprite)
    }
    append(){
        const model=model2d.outlineCircle(1,10*1000,150)
        this.sprite.fill_color(this.color)
        this.sprite.drawModel(model)

        this.set_current(v2.new(20,20),10)
    }

    /*dest_position:Vec2=v2.new(0,0)
    dest_radius:number=0

    begin_position:Vec2=v2.new(50,50)
    begin_radius:number=100

    current_t=0
    final_t=80*/

    color:Color=ColorM.hex("#21f2")

    tick(dt:number){
        /*if(this.current_t<this.final_t){
            this.current_t+=dt
            const t=this.current_t/this.final_t
            this.set_current(v2.lerp(this.begin_position,this.dest_position,t),Numeric.lerp(this.begin_radius,this.dest_radius,t))
        }*/
    }

    update_from_data(data:DeadZoneUpdate){
        this.set_current(data.position,data.radius)
    }

    set_current(position:Vec2,radius:number){
        this.position=position
        this.radius=radius

        this.sprite.scale=v2.new(radius,radius)
        this.sprite.position=position

        if(!this.game.terrain.map)return
        const rm=Numeric.clamp(radius/this.game.terrain.map.size.x,0,1)
        const dd=ColorM.lerp(ColorM.hex("#f125"),ColorM.hex("#21f4"),rm)
        this.color.r=dd.r
        this.color.g=dd.g
        this.color.b=dd.b
        this.color.a=dd.a
    }
}