import { Container2D, Sprite2D } from "../engine/container_2d.ts"
import { v2, Vec2 } from "common/scripts/engine/geometry.ts"
import { zIndexes } from "common/scripts/others/constants.ts"
import { CreatureData } from "common/scripts/others/objectsEncode.ts"
import { CreatureDef, Creatures } from "common/scripts/definitions/objects/creatures.ts"
import { GameObject } from "../others/gameObject.ts"
import { Numeric } from "common/scripts/engine/utils.ts";
export class Creature extends GameObject{
    stringType:string="creature"
    numberType: number=10

    container:Container2D=new Container2D()

    main_sprite:Sprite2D=new Sprite2D()
    def!:CreatureDef
    state:number=0
    dead:boolean=false

    create(args: {}): void {
        this.game.camera.addObject(this.container)
    }

    set_def(def:CreatureDef){
        if(this.def)return
        this.def=def
        this.main_sprite.set_frame(def.frame.main,this.game.resources)
    }
    override onDestroy(): void {
        this.container.destroy()
    }
    update(dt:number): void {
        if(this.dest_pos){
            this.position=v2.lerp(this.position,this.dest_pos,this.game.inter_global)
            this.container.rotation=Numeric.lerp_rad(this.container.rotation,this.dest_rot!,this.game.inter_global)
        }
        this.container.position=this.position
        this.manager.cells.updateObject(this)
    }
    kill(){
        if(this.dead)return
        this.dead=true
        this.container.zIndex=zIndexes.DeadCreatures
    }
    constructor(){
        super()
        this.container.add_child(this.main_sprite)
        this.container.zIndex=zIndexes.Creatures
        this.main_sprite.hotspot=v2.new(.5,.5)
        this.main_sprite.zIndex=2
    }
    dest_pos?:Vec2
    dest_rot?:number
    override updateData(data: CreatureData): void {
        if(this.game.save.get_variable("cv_game_interpolation")&&!data.full){
            this.dest_pos=data.position
            this.dest_rot=data.angle
        }else{
            this.container.rotation=data.angle
            this.position=data.position
        }
        if(data.full){
            this.set_def(Creatures.getFromNumber(data.full.def))
            this.hb=this.def.hitbox.transform(this.position)
            if(data.full.dead){
                this.kill()
            }
        }
    }
}