import { type Game2D } from "./game.ts";
import { Vec2, v2 } from "./geometry.ts";

export abstract class Particle2D{
    position:Vec2=v2.new(0,0)
    rotation:number=0
    scale:number=0

    manager!:ParticlesManager2D
    destroyed:boolean=false

    abstract update(dt:number):void;
    abstract on_create():void;
    abstract on_destroy():void;

    constructor(){

    }
}
export class ParticlesEmitter2D<Particle extends Particle2D>{
    particle:()=>Particle
    delay:number
    enabled:boolean

    destroyed:boolean=false
    current_delay:number=0
    constructor(config:ParticlesEmitter2DConfig<Particle>){
        this.particle=config.particle
        this.delay=config.delay
        this.enabled=config.enabled!==undefined?config.enabled:true
    }
}
export interface ParticlesEmitter2DConfig<Particle extends Particle2D>{
    particle:()=>Particle
    delay:number
    enabled?:boolean
}
export class ParticlesManager2D<Particle extends Particle2D=Particle2D>{
    particles:Particle[]=[]
    emitters:ParticlesEmitter2D<Particle>[]=[]
    game:Game2D
    constructor(game:Game2D){
        this.game=game
    }
    add_particle(p:Particle):Particle{
        p.manager=this
        this.particles.push(p)
        p.on_create()
        return p
    }
    add_emiter(config:ParticlesEmitter2DConfig<Particle>):ParticlesEmitter2D<Particle>{
        const e=new ParticlesEmitter2D<Particle>(config)
        this.emitters.push(e)
        return e
    }
    update(dt:number){
        for(let i=0;i<this.emitters.length;i++){
            if(this.emitters[i].destroyed){
                this.emitters.splice(i,1)
                i--
                continue
            }
            if(this.emitters[i].enabled&&!this.emitters[i].destroyed){
                if(this.emitters[i].current_delay<=0){
                    this.emitters[i].current_delay=this.emitters[i].delay
                    this.add_particle(this.emitters[i].particle())
                }else{
                    this.emitters[i].current_delay-=dt
                }
            }
        }
        for(let i=0;i<this.particles.length;i++){
            if(this.particles[i].destroyed){
                this.particles[i].on_destroy()
                this.particles.splice(i,1)
                i--
                continue
            }
            this.particles[i].update(dt)
        }
    }
}