import { BaseGameObject2D, CircleHitbox2D, v2, Vec2 } from "common/scripts/engine/mod.ts"
import { BulletData } from "common/scripts/others/objectsEncode.ts";
import { BulletDef, DamageReason } from "common/scripts/definitions/utils.ts";
import { CATEGORYS } from "common/scripts/others/constants.ts";
import { Obstacle } from "./obstacle.ts";
import { Player } from "./player.ts";
import { Ammos } from "common/scripts/definitions/ammo.ts";
import { Game } from "../others/game.ts";
import { ServerGameObject } from "../others/gameObject.ts";

export class Bullet extends ServerGameObject{
    velocity:Vec2
    stringType:string="bullet"
    numberType: number=3
    defs!:BulletDef

    initialPosition!:Vec2
    maxDistance:number=0

    owner?:Player
    angle:number=0

    modifiers={
        speed:1,
        size:1,
    }

    constructor(){
        super()
        this.velocity=v2.new(0,0)
        this.netSync.deletion=false
    }
    interact(_user: Player): void {
      return
    }
    update(dt:number): void {
        if(v2.distance(this.initialPosition,this.position)>this.maxDistance){
            this.destroy()
        }
        this.position=v2.add(this.position,v2.scale(this.velocity,dt))
        this.manager.cells.updateObject(this)
        const objs=this.manager.cells.get_objects(this.hb,[CATEGORYS.OBSTACLES,CATEGORYS.PLAYERS])
        for(const obj of objs){
            switch((obj as BaseGameObject2D).stringType){
                case "player":
                    if((obj as Player).hb&&this.hb.collidingWith((obj as Player).hb)){
                        (obj as Player).damage({amount:this.defs.damage,owner:this.owner,reason:DamageReason.Player})
                        this.destroy()
                        break
                    }
                    break
                case "obstacle":
                    if((obj as Obstacle).def.noBulletCollision)break
                    if((obj as Obstacle).hb&&this.hb.collidingWith((obj as Obstacle).hb)){
                        (obj as Obstacle).damage({amount:this.defs.damage,owner:this.owner,reason:DamageReason.Player})
                        this.destroy()
                    }
                    break
            }
        }
    }
    create(args: {defs:BulletDef,position:Vec2,ammo:string}): void {
        this.defs=args.defs
        this.hb=new CircleHitbox2D(v2.duplicate(args.position),this.defs.radius*this.modifiers.size)
        this.initialPosition=v2.duplicate(this.hb.position)
        this.maxDistance=this.defs.range/2.5
        const ad=Ammos.getFromString(args.ammo)
        this.tracerColor=this.defs.tracer.color??(ad?ad.defaultTrail:0xffffff)
    }
    set_direction(angle:number){
        this.velocity=v2.maxDecimal(v2.scale(v2.from_RadAngle(angle),this.defs.speed*this.modifiers.speed),4)
        this.dirty=true
        this.angle=angle;

        (this.hb as CircleHitbox2D).radius=this.defs.radius*this.modifiers.size
    }
    onDestroy(): void {
        delete (this.game as Game).bullets[this.id]
    }
    tracerColor:number=0
    getData(): BulletData {
        return {
            position:this.position,
            initialPos:this.initialPosition,
            maxDistance:this.maxDistance,
            radius:(this.hb as CircleHitbox2D).radius,
            speed:this.defs.speed*this.modifiers.speed,
            angle:this.angle,
            tracerWidth:this.defs.tracer.width,
            tracerHeight:this.defs.tracer.height*this.modifiers.size,
            tracerColor:this.tracerColor
        }
    }
}