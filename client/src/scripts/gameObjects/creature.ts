import { Container2D, Sprite2D } from "../engine/container.ts";
import { v2 } from "common/scripts/engine/geometry.ts";
import { zIndexes } from "common/scripts/others/constants.ts";
import { CreatureData } from "common/scripts/others/objectsEncode.ts";
import { CreatureDef, Creatures } from "common/scripts/definitions/objects/creatures.ts";
import { Numeric } from "common/scripts/engine/utils.ts";
import { GameObject } from "../others/gameObject.ts";
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
    override updateData(data: CreatureData): void {
        this.container.rotation=Numeric.lerp_rad(this.container.rotation,data.angle,0.75)
        if(v2.distance(this.position,data.position)<=1){
            this.position=v2.lerp(this.position,data.position,0.8)
        }else{
            this.position=data.position
        }
        this.hb.translate(data.position)
        this.container.position=data.position
        if(data.full){
            this.set_def(Creatures.getFromNumber(data.full.def))
            this.hb=this.def.hitbox.transform(this.position)
            if(data.full.dead){
                this.kill()
            }
        }
        this.manager.cells.updateObject(this)
    }
}