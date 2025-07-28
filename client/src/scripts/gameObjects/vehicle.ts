import { ClientGameObject2D } from "../engine/mod.ts";
import { Container2D, Sprite2D } from "../engine/container.ts";
import { VehicleData } from "common/scripts/others/objectsEncode.ts";
import { VehicleDef, Vehicles } from "common/scripts/definitions/objects/vehicles.ts";
import { v2 } from "common/scripts/engine/geometry.ts";
import { zIndexes } from "common/scripts/others/constants.ts";
import { Numeric } from "common/scripts/engine/mod.ts";
export class Vehicle extends ClientGameObject2D{
    stringType:string="vehicle"
    numberType: number=9

    container:Container2D=new Container2D()
    def?:VehicleDef

    main_sprite:Sprite2D=new Sprite2D()
    movable_wheels:Sprite2D[]=[]

    create(args: {}): void {
        this.game.camera.addObject(this.container)
    }


    override onDestroy(): void {
        this.container.destroy()
    }
    update(dt:number): void {
        this.dir=Numeric.lerp_rad(this.dir,this.dest_dir,1/(1+dt*1000))
        for(const w of this.movable_wheels){
            w.rotation=this.dir
        }
    }
    set_def(def:VehicleDef){
        if(this.def)return
        this.def=def
        this.main_sprite.frame=def.frame.base?this.game.resources.get_sprite(def.frame.base):this.game.resources.get_sprite(def.idString)
        if(def.frame.base_scale){
            this.main_sprite.scale=v2.new(def.frame.base_scale,def.frame.base_scale)
        }
        const hotspot=v2.new(.5,.5)
        for(const w of def.wheels.defs){
            const spr=new Sprite2D()
            spr.frame=this.game.resources.get_sprite("wheel")
            spr.position=v2.duplicate(w.position)
            spr.hotspot=hotspot
            spr.zIndex=1
            spr.scale=v2.new(w.scale,w.scale)
            if(w.movable){
                this.movable_wheels.push(spr)
            }
            this.container.add_child(spr)
        }
        this.container.updateZIndex()
    }
    constructor(){
        super()
        this.container.add_child(this.main_sprite)
        this.container.zIndex=zIndexes.Vehicles
        this.main_sprite.hotspot=v2.new(.5,.5)
        this.main_sprite.zIndex=2
    }
    dir:number=0
    dest_dir:number=0
    override updateData(data: VehicleData): void {
        this.container.rotation=data.rotation
        this.container.position=data.position
        if(data.full){
            this.set_def(Vehicles.getFromNumber(data.full.def))
        }
        this.dest_dir=Numeric.clamp(data.direction, -Math.PI / 8, Math.PI / 8)
    }
}