import { CircleHitbox2D, NullVec2, Numeric, v2, Vec2 } from "common/scripts/engine/mod.ts"
import { type Player } from "./player.ts";
import { ProjectileDef } from "common/scripts/definitions/projectiles.ts";
import { Explosions } from "common/scripts/definitions/explosions.ts";
import { ProjectileData } from "common/scripts/others/objectsEncode.ts";
import { ServerGameObject } from "../others/gameObject.ts";
import { CATEGORYS } from "common/scripts/others/constants.ts";
import { DamageReason } from "common/scripts/definitions/utils.ts";
import { type Obstacle } from "./obstacle.ts";

export class Projectile extends ServerGameObject{
    stringType:string="projectile"
    numberType: number=6
    defs!:ProjectileDef

    owner?:Player

    zpos:number=1
    rotation:number=0

    velocity:Vec2
    angularVelocity:number

    constructor(){
        super()
        this.velocity=v2.new(3,0)
        this.angularVelocity=10
    }
    throw_projectile(ang:number,speed:number=3,angularVelocity:number=10){
        this.velocity=v2.scale(v2.from_RadAngle(ang),speed)
        this.angularVelocity=angularVelocity
        this.rotation=ang
    }
    interact(_user: Player): void {
        return
    }

    fuse_delay:number=0
    update(dt:number): void {
        if(!v2.is(this.velocity,NullVec2)){
            this.position=v2.clamp2(v2.add(this.position,v2.scale(this.velocity,dt)),NullVec2,this.game.map.size)
            this.manager.cells.updateObject(this)
            this.dirtyPart=true
        }
        if(this.angularVelocity!=0){
            this.rotation+=this.angularVelocity*dt
            this.dirtyPart=true
        }
        if(this.zpos>0){
            this.zpos=Math.max(this.zpos-this.defs.gravity*dt,0)
        }else{
            this.angularVelocity=Numeric.lerp(this.angularVelocity,0,dt*this.defs.decays.ground_rotation)
            this.velocity=v2.lerp(this.velocity,NullVec2,dt*this.defs.decays.ground_speed)
        }
        if(this.defs.cook){
            this.fuse_delay-=dt
            if(this.fuse_delay<=0){
                this.destroy();
                if(this.defs.explosion)this.game.add_explosion(this.position,Explosions.getFromString(this.defs.explosion),this.owner)
            }
        }
        if(this.fuse_delay>0){
            const objs:ServerGameObject[]=this.manager.cells.get_objects(this.hb,[CATEGORYS.OBSTACLES,CATEGORYS.PLAYERS])
            for(const obj of objs){
                switch(obj.stringType){
                    case "player":
                        if((obj as Player).hb&&obj.hb.collidingWith(this.hb)&&this.defs.destroy_on_collide){
                            if(this.defs.collision_damage)(obj as Player).damage({amount:this.defs.collision_damage,critical:false,position:this.position,reason:DamageReason.Player,owner:this.owner})
                            this.fuse_delay=0
                            break
                        }
                        break
                    case "obstacle":
                        if((obj as Obstacle).def.noCollision)break
                        if((obj as Obstacle).hb&&!(obj as Obstacle).dead){
                            const col=this.hb.overlapCollision((obj as Obstacle).hb)
                            if(!col)continue
                            if(this.defs.destroy_on_collide){
                                if(this.defs.collision_damage)(obj as Obstacle).damage({amount:this.defs.collision_damage,critical:false,position:this.position,reason:DamageReason.Player,owner:this.owner})
                                this.fuse_delay=0
                            }
                        }
                        break
                }
            }
        }
    }
    create(args: {defs:ProjectileDef,position:Vec2,owner?:Player}): void {
        this.defs=args.defs
        this.hb=new CircleHitbox2D(args.position,this.defs.radius)
        if(this.defs.cook){
            this.fuse_delay=this.defs.cook.fuse_time
        }
        this.owner=args.owner
    }
    getData(): ProjectileData {
        return {
            position:this.position,
            rotation:this.rotation,
            z:this.zpos,
            full:{
                definition:this.defs.idNumber!
            }
        }
    }
}