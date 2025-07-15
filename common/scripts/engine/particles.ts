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
export class ParticlesManager2D<Particle extends Particle2D=Particle2D>{
    particles:Particle[]=[]
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
    update(dt:number){
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