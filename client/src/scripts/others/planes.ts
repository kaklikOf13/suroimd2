import { PlaneData } from "common/scripts/packets/update_packet.ts";
import { Container2D, Sprite2D } from "../engine/container.ts";
import { type Game } from "./game.ts";
import { v2, Vec2 } from "common/scripts/engine/geometry.ts";
import { zIndexes } from "common/scripts/others/constants.ts";
import { SoundInstance } from "../engine/sounds.ts";

export class Plane{
    container:Container2D=new Container2D()
    sprite:Sprite2D=new Sprite2D()
    destroyed:boolean=false

    sound?:SoundInstance
    free(){
        this.container.destroy()
        this.sprite.destroy()
        this.destroyed=false
        if(this.sound)this.sound.stop()
    }
    game:Game
    id:number=0
    constructor(game:Game){
        this.game=game
        this.container.add_child(this.sprite)
        this.game.camera.addObject(this.container)
        this.container.zIndex=zIndexes.Planes
    }
    dest_pos?:Vec2
    initial=true
    update(dt:number){
        if(this.dest_pos){
            this.container.position=v2.lerp(this.container.position,this.dest_pos,this.game.inter_global)
        }
    }
    updateData(data:PlaneData){
        if(this.game.save.get_variable("cv_game_interpolation")){
            this.dest_pos=data.pos
        }else{
            this.container.position=data.pos
        }
        if(data.complete){
            this.free()
        }
        this.container.rotation=data.direction
        if(!this.sound){
            this.sound=this.game.sounds.play(this.game.resources.get_audio("airdrop_plane_sfx"),{
                max_distance:80,
                position:v2.duplicate(this.container.position),
                loop:true,
                volume:0.5
            })
        }
        if(this.sound)this.sound.position=v2.duplicate(this.container.position)
        if(!this.sprite.frame){
            this.sprite.set_frame({
                image:"airdrop_plane",
                scale:14,
                hotspot:v2.new(.5,.5)
            },this.game.resources)
        }
        if(this.initial){
            this.id=data.id
            this.container.position=this.dest_pos
            this.initial=false
        }
    }
}