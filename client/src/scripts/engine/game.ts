import { BaseGameObject2D, DefaultEvents, DefaultEventsMap2D, Game2D, Numeric, Particle2D, ParticlesManager2D, v2, Vec2 } from "common/scripts/engine/mod.ts";
import { Color, ColorM, type Renderer } from "./renderer.ts";
import { ResourcesManager } from "./resources.ts";
import { type GamepadManager, InputManager, KeyListener, MousePosListener } from "./keys.ts";
import { SoundManager } from "./sounds.ts";
import { Tween, TweenOptions } from "./utils.ts";
import { Camera2D, Container2D, Sprite2D } from "./container.ts";
import { GameConsole } from "./console.ts";
export const isMobile=/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
export abstract class ClientGameObject2D extends BaseGameObject2D{
    // deno-lint-ignore no-explicit-any
    declare game:ClientGame2D<any,any>
    
    constructor(){
        super()
    }
    render(_camera:Camera2D,_renderer:Renderer,_dt:number){}
}
export abstract class ClientParticle2D extends Particle2D{
    container:Container2D
    constructor(){
        super()
        this.container=new Container2D()
        this.container.visible=false
        this.container.position=this.position
    }
    override on_create(): void {
        (this.manager.game as unknown as ClientGame2D).camera.addObject(this.container)
    }
    override on_destroy(): void {
        this.container.destroy()
    }
}
export interface ABParticle2Config{
    sprite:string
    position:Vec2
    speed:number
    direction:number
    life_time:number
    zIndex?:number
    angle?:number
    scale?:number
    tint?:Color
    to?:{
        position?:Vec2
        speed?:number
        direction?:number
        angle?:number
        scale?:number
        tint?:Color
    }
}
export class ABParticle2D extends ClientParticle2D{
    ticks=0
    config:ABParticle2Config
    sprite:Sprite2D=new Sprite2D()

    constructor(config:ABParticle2Config){
        super()
        this.config=config
        this.position=v2.duplicate(config.position)
        this.container.position=this.position
        this.container.scale=v2.new(config.scale??1,config.scale??1)
        this.container.rotation=config.angle??0
        this.container.zIndex=config.zIndex??0
        if(config.tint){
            this.container.tint=ColorM.clone(config.tint)
        }
    }
    override update(dt: number): void {
        this.ticks+=dt
        if(this.ticks>=this.config.life_time){
            this.destroyed=true
        }

        const tt=this.ticks/this.config.life_time
        let speed=this.config.speed
        if(this.config.to?.speed){
            speed=Numeric.lerp(this.config.speed,this.config.to.speed,tt)
        }
        if(this.config.to?.angle){
            this.container.rotation=Numeric.lerp(this.config.angle??0,this.config.to.angle,tt)
        }
        let dire=this.config.direction
        if(this.config.to?.direction){
            dire=Numeric.lerp(this.config.direction,this.config.to.direction,tt)
        }
        if(this.config.to?.scale){
            this.scale=Numeric.lerp(this.config.scale??1,this.config.to.scale,tt)
            this.container.scale.x=this.scale
            this.container.scale.y=this.scale
        }
        if(this.config.to?.tint){
            this.container.tint=ColorM.lerp(this.config.tint??ColorM.default.white,this.config.to.tint,tt)
        }
        const vel=v2.scale(v2.from_RadAngle(dire),speed*dt)
        this.container.position.x+=vel.x
        this.container.position.y+=vel.y

    }
    override on_create(): void {
        super.on_create()
        this.sprite.frame=(this.manager.game as unknown as ClientGame2D).resources.get_sprite(this.config.sprite)
        this.container.add_child(this.sprite)
        this.container.visible=true
    }
}
export class ClientGame2D<Events extends DefaultEvents = DefaultEvents, EMap extends DefaultEventsMap2D = DefaultEventsMap2D> extends Game2D<ClientGameObject2D,Events,EMap>{
    camera:Camera2D
    renderer:Renderer
    resources:ResourcesManager

    particles:ParticlesManager2D<ClientParticle2D>
    input_manager:InputManager

    sounds:SoundManager
    save:GameConsole
    constructor(input_manager:InputManager,console:GameConsole,resources:ResourcesManager,sounds:SoundManager,renderer:Renderer,objects:Array<new ()=>ClientGameObject2D>=[]){
        super(60,objects)
        this.sounds=sounds
        this.input_manager=input_manager
        this.renderer=renderer
        this.resources=resources
        this.camera=new Camera2D(renderer)
        this.particles=new ParticlesManager2D(this as unknown as Game2D)
        this.save=console
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
        this.camera.container.draw(renderer)
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