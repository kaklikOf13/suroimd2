import { ClientGameObject2D } from "../engine/mod.ts";
import { Container2D, Sprite2D } from "../engine/container.ts";
import { VehicleData } from "common/scripts/others/objectsEncode.ts";
import { VehicleDef, Vehicles } from "common/scripts/definitions/objects/vehicles.ts";
import { v2 } from "common/scripts/engine/geometry.ts";
import { zIndexes } from "common/scripts/others/constants.ts";
export class Vehicle extends ClientGameObject2D{
    stringType:string="vehicle"
    numberType: number=9

    container:Container2D=new Container2D()
    def?:VehicleDef

    main_sprite:Sprite2D=new Sprite2D()

    create(args: {}): void {
        this.game.camera.addObject(this.container)
    }


    override onDestroy(): void {
        this.container.destroy()
    }
    update(dt:number): void {
    }
    set_def(def:VehicleDef){
        if(this.def)return
        this.def=def
        this.main_sprite.frame=def.frame.base?this.game.resources.get_sprite(def.frame.base):this.game.resources.get_sprite(def.idString)
        if(def.frame.base_scale){
            this.main_sprite.scale=v2.new(def.frame.base_scale,def.frame.base_scale)
        }
    }
    constructor(){
        super()
        this.container.add_child(this.main_sprite)
        this.container.zIndex=zIndexes.Vehicles
        this.main_sprite.hotspot=v2.new(.5,.5)
    }
    override updateData(data: VehicleData): void {
        this.container.rotation=data.rotation
        this.container.position=data.position
        if(data.full){
            this.set_def(Vehicles.getFromNumber(data.full.def))
        }
    }
}