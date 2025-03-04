import { BaseObject2D, GameObjectManager2D } from "./gameObject.ts";
import { Angle, Vec2, v2 } from "./geometry.ts";

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
}
export class ParticlesManager2D<GameObject extends BaseObject2D>{
    particles:Particle2D<GameObject>[]=[]
    manager:GameObjectManager2D<GameObject>
    constructor(manager:GameObjectManager2D<GameObject>){
        this.manager=manager
    }
    // deno-lint-ignore no-explicit-any
    add_particle(position:Vec2,rotation:number,args:any,update?:Particle2DUpdateFunction<GameObject>):Particle2D<GameObject>{
        const p=new Particle2D(this)
        p.args=args
        p.position=position
        p.rotation=rotation
        p.update=update
        this.particles.push(p)
        return p
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

export interface Particle2DLifetime1{
    lifetime:number
    speed:number
    angular_speed:number
}
export const Particles2DBase={
    life_timed1<GameObject  extends BaseObject2D>(particle:Particle2D<GameObject>,dt:number){
        (particle.args as Particle2DLifetime1).lifetime-=dt
        if((particle.args as Particle2DLifetime1).lifetime<=0){
            particle.destroyed=true
        }else{
            particle.velocity=v2.scale(v2.from_RadAngle(particle.rotation),(particle.args as Particle2DLifetime1).speed)
            particle.rotation+=(particle.args as Particle2DLifetime1).angular_speed
        }
    }
}