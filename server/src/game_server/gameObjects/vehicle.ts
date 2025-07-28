import { CircleHitbox2D, Numeric, v2, Vec2 } from "common/scripts/engine/mod.ts"
import { VehicleData } from "common/scripts/others/objectsEncode.ts";
import { type Player } from "./player.ts";
import { ServerGameObject } from "../others/gameObject.ts"; 
import {VehicleDef} from "common/scripts/definitions/objects/vehicles.ts"
export class VehicleSeat{
    player?:Player
    position:Vec2
    base_position:Vec2
    rotation?:number
    pillot:boolean
    vehicle:Vehicle
    leave:Vec2
    constructor(vehicle:Vehicle,position:Vec2,pillot:boolean,leave:Vec2){
        this.vehicle=vehicle
        this.position=position
        this.base_position=v2.duplicate(position)
        this.pillot=pillot
        this.leave=leave
    }
    clear_player(){
        if(!this.player)return
        this.player.dirty=true
        this.player.seat=undefined
        this.player=undefined
    }
    set_player(p:Player){
        if(this.player)return
        this.player=p
        p.seat=this
    }
}
export class Vehicle extends ServerGameObject{
    stringType:string="vehicle"
    numberType: number=9

    angle:number=0
    direction:number=0
    dead:boolean=false
    def!:VehicleDef

    velocity:Vec2=v2.new(0,0)
    speed:number=0
    old_pos:Vec2=v2.new(-1,-1)

    seats:VehicleSeat[]=[]

    constructor(){
        super()
    }
    is_moving:boolean=false
    move(direction:Vec2,dt:number){
        if(direction.x!==0||direction.y!==0){
            const dir=Math.atan2(direction.y,direction.x)
            this.angle=Numeric.lerp_rad(this.angle,dir,1/(1+dt*this.def.movimentation.angle_acceleration))
            this.is_moving=true
            this.direction=Numeric.normalize_rad(dir - this.angle)
            this.speed=Numeric.lerp(this.speed,this.def.movimentation.final_speed,1/(1+dt*this.def.movimentation.acceleration))
        }
    }
    interact(_user: Player): void {
      return
    }
    update(dt:number): void {
        if(!v2.is(this.old_pos,this.position)){
            this.manager.cells.updateObject(this)
            this.dirtyPart=true
            this.old_pos=v2.duplicate(this.position)
        }
        for(const s of this.seats){
            s.position=v2.add(this.position,v2.rotate_RadAngle(s.base_position,this.angle))
            if(s.player)s.player.position=s.position
            s.rotation=this.angle
        }
        this.position=v2.add(this.position,v2.scale(this.velocity,dt))
        if(!this.is_moving)this.speed=Numeric.lerp(this.speed,0,1/(1+dt*this.def.movimentation.desacceleration))
        this.is_moving=false
        this.velocity=v2.scale(v2.from_RadAngle(this.angle),this.speed)
    }
    create(args: {position:Vec2,def:VehicleDef}): void {
        this.hb=new CircleHitbox2D(args.position,2)
        this.def=args.def
        this.seats.push(new VehicleSeat(this,this.def.pillot_seat.position,true,this.def.pillot_seat.leave))
        for(const s of this.def.seats??[]){
            this.seats.push(new VehicleSeat(this,s.position,false,s.leave))
        }
    }
    override onDestroy(): void {
    }
    override getData(): VehicleData {
        return {
            position:this.position,
            rotation:this.angle,
            direction:this.direction,
            full:{
                dead:this.dead,
                def:this.def.idNumber!
            }
        }
    }
}