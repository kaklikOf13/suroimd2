import { Definition } from "./definitions.ts";
import { type Game2D } from "./game.ts";
import { BaseObject2D, GameObjectManager2D } from "./gameObject.ts";
import { Vec2, v2 } from "./geometry.ts";
import { random } from "common/scripts/engine/random.ts";
import { cloneDeep } from "./utils.ts";

export type Particle2DUpdateFunction<GameObject  extends BaseObject2D>=(particle:Particle2D<GameObject>,dt:number)=>void
export class Particle2D<GameObject extends BaseObject2D>{
    position:Vec2=v2.new(0,0)
    rotation:number=0
    velocity:Vec2=v2.new(0,0)
    manager:ParticlesManager2D<GameObject>
    destroyed:boolean=false
    update?:Particle2DUpdateFunction<GameObject>
    // deno-lint-ignore no-explicit-any
    args:any
    constructor(manager:ParticlesManager2D<GameObject>){
        this.manager=manager
    }
    process_sprite(_game:Game2D,_sprite:string){

    }
}
export interface ParticleDef2D<GameObject extends BaseObject2D=BaseObject2D> extends Definition{
    // deno-lint-ignore no-explicit-any
    args:any
    sprite?:string
    update?:Particle2DUpdateFunction<GameObject>
    // deno-lint-ignore no-explicit-any
    create?:(args:any)=>any
}
export class ParticlesManager2D<GameObject extends BaseObject2D=BaseObject2D>{
    particles:Particle2D<GameObject>[]=[]
    manager:GameObjectManager2D<GameObject>
    particle:new(manager:ParticlesManager2D<GameObject>)=>Particle2D<GameObject>
    game:Game2D
    constructor(game:Game2D,manager:GameObjectManager2D<GameObject>){
        this.manager=manager
        this.game=game
        this.particle=Particle2D<GameObject>
    }
    // deno-lint-ignore no-explicit-any
    add_particle(position:Vec2,rotation:number,args:any,update?:Particle2DUpdateFunction<GameObject>,sprite?:string):Particle2D<GameObject>{
        const p=new this.particle(this)
        p.args=args
        p.position=v2.duplicate(position)
        p.rotation=rotation
        p.update=update
        if(sprite&&this.game)p.process_sprite(this.game,sprite)
        this.particles.push(p)
        return p
    }
    add_particle_with_def(position:Vec2,rotation:number,def:ParticleDef2D<GameObject>){
        const args=def.create?def.create(def.args):cloneDeep(def.args)
        this.add_particle(position,rotation,args,def.update,def.sprite)
    }
    update(dt:number){
        for(let i=0;i<this.particles.length;i++){
            if(this.particles[i].destroyed){
                this.particles.splice(i,1)
                i--
                continue
            }
            if(this.particles[i].update){
                this.particles[i].update!(this.particles[i],dt)
                this.particles[i].position.x+=this.particles[i].velocity.x
                this.particles[i].position.y+=this.particles[i].velocity.y
            }
        }
    }
}

export interface Particle2DLifetime1Values{
    lifetime:number
    speed:number
    angular_speed:number
}
export interface Particle2DLifetime1Args{
    lifetime:{
        min:number
        max:number
    }
    speed:{
        min:number
        max:number
    }
    angular_speed:{
        min:number
        max:number
    }
}
export const Particles2DBase={
    life_timed1_update<GameObject  extends BaseObject2D>(particle:Particle2D<GameObject>,dt:number){
        (particle.args as Particle2DLifetime1Values).lifetime-=dt
        if((particle.args as Particle2DLifetime1Values).lifetime<=0){
            particle.destroyed=true
        }else{
            particle.velocity=v2.scale(v2.from_RadAngle(particle.rotation),(particle.args as Particle2DLifetime1Values).speed)
            particle.rotation+=(particle.args as Particle2DLifetime1Values).angular_speed
        }
    },
    life_timed1_create(args:Particle2DLifetime1Args):Particle2DLifetime1Values{
        return {
            angular_speed:random.float(args.angular_speed.min,args.angular_speed.max)*random.choose([-1,1]),
            lifetime:random.float(args.lifetime.min,args.lifetime.max),
            speed:random.float(args.speed.min,args.speed.max)
        }
    }
}