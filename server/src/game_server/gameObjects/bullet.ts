import { BaseGameObject2D, CircleHitbox2D, Numeric, v2, Vec2 } from "common/scripts/engine/mod.ts"
import { BulletData } from "common/scripts/others/objectsEncode.ts";
import { BulletDef, DamageReason, GameItem } from "common/scripts/definitions/utils.ts";
import { Obstacle } from "./obstacle.ts";
import { Player } from "./player.ts";
import { Ammos } from "../../../../common/scripts/definitions/items/ammo.ts";
import { ServerGameObject } from "../others/gameObject.ts"; 
import { DamageSourceDef } from "common/scripts/definitions/alldefs.ts";
import { Creature } from "./creature.ts";

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

    critical:boolean=false
    source?:GameItem

    damage:number=0
    tticks:number=0

    reflectionCount:number=0
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
        this.tticks+=dt
        const disT=v2.distance(this.initialPosition,this.position)/this.maxDistance
        this.position=v2.add(this.position,v2.scale(this.velocity,dt))
        this.manager.cells.updateObject(this)
        const objs=this.manager.cells.get_objects(this.hb,this.layer)
        for(const obj of objs){
            switch(obj.stringType){
                case "player":{
                    if((obj as Player).hb&&!(obj as Player).dead&&(!this.owner||((obj as Player).id===this.owner.id&&this.reflectionCount>0)||(obj as Player).id!==this.owner.id)&&this.hb.collidingWith((obj as Player).hb)&&!(obj as Player).parachute){
                        const dmg:number=this.damage
                        *(this.defs.falloff?Numeric.lerp(1,this.defs.falloff,disT):1)
                        *(this.critical?(this.defs.criticalMult??1.5):1);
                        (obj as Player).damage({amount:dmg,owner:this.owner,reason:DamageReason.Player,position:v2.duplicate(this.position),critical:this.critical,source:this.source as unknown as DamageSourceDef})
                        this.destroy()
                        break
                    }
                    break
                }
                case "creature":{
                    if((obj as Creature).hb&&!(obj as Creature).dead){
                        const dmg:number=this.damage
                        *(this.defs.falloff?Numeric.lerp(1,this.defs.falloff,disT):1)
                        *(this.critical?(this.defs.criticalMult??1.5):1);
                        (obj as Player).damage({amount:dmg,owner:this.owner,reason:DamageReason.Player,position:v2.duplicate(this.position),critical:this.critical,source:this.source as unknown as DamageSourceDef})
                        this.destroy()
                        break
                    }
                    break
                }
                case "obstacle":
                    if((obj as Obstacle).def.noBulletCollision)break
                    if((obj as Obstacle).hb&&!(obj as Obstacle).dead){
                        const col=this.hb.overlapCollision((obj as Obstacle).hb)
                        if(!col)continue
                        const od=(obj as Obstacle).health;
                        (obj as Obstacle).damage({amount:(this.damage*(this.defs.obstacleMult??1)),owner:this.owner,reason:DamageReason.Player,position:v2.duplicate(this.position),critical:this.critical,source:this.source as unknown as DamageSourceDef})
                        if((obj as Obstacle).def.reflectBullets&&this.reflectionCount<3){
                            const angle = 2 * Math.atan2(col.dir.y, -col.dir.x) - this.angle
                            this.position = v2.add(this.position, v2.new(Math.cos(angle), -Math.sin(angle)))
                            this.reflect(angle)
                        }
                        this.destroy()
                        if((obj as Obstacle).dead){
                            this.damage-=od*(this.defs.obstacleMult??1)
                            if(this.damage>0&&!(obj as Obstacle).def.reflectBullets){
                                this.game.add_bullet(this.position,this.angle,this.defs,this.owner,this.ammo,this.source)
                            }
                        }
                    }
                    break
            }
        }
    }
    ammo:string=""
    create(args: {defs:BulletDef,position:Vec2,owner:Player,ammo:string,critical?:boolean,source?:GameItem}): void {
        this.defs=args.defs
        this.hb=new CircleHitbox2D(v2.duplicate(args.position),this.defs.radius*this.modifiers.size)
        this.initialPosition=v2.duplicate(this.hb.position)
        this.maxDistance=this.defs.range/2.5
        const ad=Ammos.getFromString(args.ammo)
        this.tracerColor=this.defs.tracer.color??(ad?ad.defaultTrail:0xffffff)
        this.projColor=this.defs.tracer.proj.color??(ad?ad.defaultProj:0xffffff)
        this.owner=args.owner
        this.critical=args.critical??(Math.random()<=0.15)
        this.source=args.source
        this.ammo=args.ammo

        this.damage=args.defs.damage
    }
    set_direction(angle:number){
        this.velocity=v2.maxDecimal(v2.scale(v2.from_RadAngle(angle),this.defs.speed*this.modifiers.speed),4)
        this.dirty=true
        this.angle=angle;

        (this.hb as CircleHitbox2D).radius=this.defs.radius*this.modifiers.size
    }
    reflect(angle:number){
        /*const b=this.game.add_bullet(this.position,angle,this.defs,this.owner,this.ammo,this.source)
        b.damage=this.damage/2
        b.reflectionCount=this.reflectionCount+1*/
    }
    override onDestroy(): void {
        delete this.game.bullets[this.id]
    }
    tracerColor:number=0
    projColor:number=0
    override getData(): BulletData {
        return {
            position:this.position,
            tticks:this.tticks,
            full:{
                initialPos:this.initialPosition,
                maxDistance:this.maxDistance,
                radius:(this.hb as CircleHitbox2D).radius,
                speed:this.defs.speed*this.modifiers.speed,
                angle:this.angle,
                tracerWidth:this.defs.tracer.width,
                tracerHeight:this.defs.tracer.height*this.modifiers.size,
                tracerColor:this.tracerColor,
                projWidth:this.defs.tracer.proj.width,
                projHeight:this.defs.tracer.proj.height*this.modifiers.size,
                projColor:this.projColor,
                projIMG:this.defs.tracer.proj.img
            }
        }
    }
}