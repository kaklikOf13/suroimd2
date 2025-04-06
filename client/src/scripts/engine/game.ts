import { Angle, BaseGameObject2D, DefaultEvents, DefaultEventsMap2D, Game2D, Particle2D, ParticlesManager2D, v2 } from "common/scripts/engine/mod.ts";
import { Camera2D, Material2D, Renderer } from "./renderer.ts";
import { ResourcesManager, Sprite } from "./resources.ts";
import { KeyListener, MousePosListener } from "./keys.ts";
import { SoundManager } from "./sounds.ts";
export abstract class ClientGameObject2D extends BaseGameObject2D{
    // deno-lint-ignore no-explicit-any
    declare game:ClientGame2D<any,any>
    
    constructor(){
        super()
    }
    abstract render(camera:Camera2D,renderer:Renderer,dt:number):void
}
export abstract class FormGameObject2D extends ClientGameObject2D{
    // deno-lint-ignore no-explicit-any
    declare game:ClientGame2D<any,any>
    abstract material:Material2D
    zIndex:number=0
    constructor(){
        super()
    }
    render(camera:Camera2D,renderer:Renderer,_dt:number){
        renderer.draw_hitbox2D(this.hb,this.material,camera.position,this.zIndex)
    }
}

export class ClientParticle2D<GameObject extends BaseGameObject2D=BaseGameObject2D> extends Particle2D<GameObject>{
    sprite?:Sprite
    process_sprite(game:Game2D,sprite: string): void {
        this.sprite=(game as unknown as ClientGame2D).resources.get_sprite(sprite)
    }
}
export class ClientGame2D<Events extends DefaultEvents = DefaultEvents, EMap extends DefaultEventsMap2D = DefaultEventsMap2D> extends Game2D<ClientGameObject2D,Events,EMap>{
    camera:Camera2D={position:v2.new(0,0),zoom:1}
    renderer:Renderer
    key:KeyListener
    mouse:MousePosListener
    resources:ResourcesManager

    particles:ParticlesManager2D<ClientGameObject2D>

    sounds:SoundManager
    constructor(keyl:KeyListener,mouse:MousePosListener,resources:ResourcesManager,sounds:SoundManager,renderer:Renderer,objects:Array<new ()=>ClientGameObject2D>=[]){
        super(60,objects)
        this.sounds=sounds
        this.mouse=mouse
        this.key=keyl
        this.renderer=renderer
        this.resources=resources
        this.particles=new ParticlesManager2D(this as unknown as Game2D,this.scene.objects)
        this.particles.particle=ClientParticle2D
    }
    draw(renderer:Renderer,dt:number){
        renderer.clear()
        this.on_render(dt)
        for(const c in this.scene.objects.objects){
            for(const o of this.scene.objects.objects[c].orden){
                this.scene.objects.objects[c].objects[o].render(this.camera,renderer,dt)
            }
        }
        for(const p of this.particles.particles){
            if((p as unknown as ClientParticle2D).sprite){
                renderer.draw_image2D((p as unknown as ClientParticle2D).sprite!,v2.sub(p.position,this.camera.position),v2.new(1,1),Angle.rad2deg(p.rotation),v2.new(.5,.5))
            }
        }
    }
    on_render(_dt:number){

    }
    on_update(dt:number){
        this.draw(this.renderer,dt)
        this.particles.update(dt)
        this.sounds.update(dt)
        this.key.tick()
    }
}