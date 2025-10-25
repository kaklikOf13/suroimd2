import { BaseGameObject2D, Game2D, ParticlesManager2D } from "common/scripts/engine/mod.ts";
import { type Renderer } from "./renderer.ts";
import { ResourcesManager } from "./resources.ts";
import { InputManager } from "./keys.ts";
import { SoundManager } from "./sounds.ts";
import { Tween, TweenOptions } from "./utils.ts";
import { Camera2D } from "./container_2d.ts";
import { GameConsole } from "./console.ts";
import { ClientParticle2D } from "./particles.ts";
export const isMobile=/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
export abstract class ClientGameObject2D extends BaseGameObject2D{
    // deno-lint-ignore no-explicit-any
    declare game:ClientGame2D<any>
    
    constructor(){
        super()
    }
    render(_camera:Camera2D,_renderer:Renderer,_dt:number){}
}
export class ClientGame2D<GObject extends ClientGameObject2D=ClientGameObject2D> extends Game2D<GObject>{
    camera:Camera2D
    renderer:Renderer
    resources:ResourcesManager

    particles:ParticlesManager2D<ClientParticle2D>
    input_manager:InputManager

    sounds:SoundManager
    save:GameConsole
    constructor(input_manager:InputManager,console:GameConsole,resources:ResourcesManager,sounds:SoundManager,renderer:Renderer,objects:Array<new ()=>GObject>=[]){
        super(60,objects)
        this.sounds=sounds
        this.input_manager=input_manager
        this.renderer=renderer
        this.resources=resources
        this.camera=new Camera2D(renderer)
        this.particles=new ParticlesManager2D(this as unknown as Game2D)
        this.save=console
        this.renderer.canvas.addEventListener("click",(_e)=>{
            this.input_manager.focus=true
        })
    }
    readonly tweens = new Set<Tween<unknown>>();
    addTween<T>(config: TweenOptions<T>): Tween<T> {
        const tween = new Tween<T>(this, config);

        this.tweens.add(tween);
        return tween;
    }
    
    removeTween(tween: Tween<unknown>): void {
        this.tweens.delete(tween);
    }
    draw(renderer:Renderer,dt:number){
        renderer.clear()
        this.camera.update(dt,this.resources)
        this.camera.draw(renderer)
        this.on_render(dt)
        for(const c in this.scene.objects.objects){
            for(const o of this.scene.objects.objects[c].orden){
                if(!this.scene.objects.objects[c].objects[o])continue
                this.scene.objects.objects[c].objects[o].render(this.camera,renderer,dt)
            }
        }
    }
    on_render(_dt:number){

    }
    override on_update(dt:number){
        for(const t of this.tweens){
            t.update(dt)
        }
        this.draw(this.renderer,dt)
        this.particles.update(dt)
        this.sounds.update(dt)
        this.input_manager.tick()
    }
}