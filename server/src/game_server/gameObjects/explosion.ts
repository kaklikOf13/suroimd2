import { CircleHitbox2D, random, v2, Vec2 } from "common/scripts/engine/mod.ts"
import { Player } from "./player.ts";
import { ExplosionData } from "common/scripts/others/objectsEncode.ts";
import { ExplosionDef } from "common/scripts/definitions/explosions.ts";
import { type Game } from "../others/game.ts";
import { Projectiles } from "common/scripts/definitions/projectiles.ts";
import { CATEGORYS } from "common/scripts/others/constants.ts";
import { Obstacle } from "./obstacle.ts";
import { DamageReason } from "common/scripts/definitions/utils.ts";
import { ServerGameObject } from "../others/gameObject.ts";

export class Explosion extends ServerGameObject{
    stringType:string="explosion"
    numberType: number=5
    defs!:ExplosionDef

    owner?:Player

    radius:number=2
    constructor(){
        super()
        this.netSync.deletion=false
    }
    delay:number=2
    interact(_user: Player): void {
        return
    }
    update(_dt:number): void {
        if(this.delay==0){
            this.manager.cells.updateObject(this)
            if(this.defs.bullet){
                for(let i=0;i<this.defs.bullet.count;i++){
                    (this.game as Game).add_bullet(this.position,random.rad(),this.defs.bullet.def,this.owner)
                }
            }
            if(this.defs.projectiles){
                for(let i=0;i<this.defs.projectiles.count;i++){
                    const p=(this.game as Game).add_projectile(this.position,Projectiles.getFromString(this.defs.projectiles.def),this.owner)
                    p.velocity=v2.random(-this.defs.projectiles.speed,this.defs.projectiles.speed)
                    p.angularVelocity=this.defs.projectiles.angSpeed+(Math.random()*this.defs.projectiles.randomAng)
                }
            }

            const objs=this.manager.cells.get_objects(this.hb,[CATEGORYS.OBSTACLES,CATEGORYS.PLAYERS,CATEGORYS.PROJECTILES])
            const damageCollisions:ServerGameObject[]=[]
            for(const obj of objs){
                switch((obj as ServerGameObject).stringType){
                    case "player":
                        if((obj as Player).hb&&this.hb.collidingWith((obj as Player).hb)){
                            damageCollisions.push(obj)
                            break
                        }
                        break
                    case "obstacle":
                        if((obj as Obstacle).hb&&this.hb.collidingWith((obj as Obstacle).hb)){
                            damageCollisions.push(obj)
                            this.destroy()
                        }
                        break
                }
            }
            for(const obj of damageCollisions){
                switch(obj.stringType){
                    case "player":{
                        (obj as Player).damage({amount:this.defs.damage,reason:DamageReason.Explosion,owner:this.owner,position:v2.duplicate(this.position),critical:false})
                        break
                    }
                    case "obstacle":
                        (obj as Obstacle).damage({amount:this.defs.damage,reason:DamageReason.Explosion,owner:this.owner,position:v2.duplicate(this.position),critical:false})
                        break
                }
            }
            this.destroy()
        }else{
            this.delay--
        }
    }
    create(args: {defs:ExplosionDef,position:Vec2}): void {
        this.defs=args.defs
        this.hb=new CircleHitbox2D(args.position,random.float(this.defs.size.min,this.defs.size.max))
    }
    getData(): ExplosionData {
        return {
            position:this.position,
            def:this.defs.idNumber!,
            radius:(this.hb as CircleHitbox2D).radius
        }
    }
}