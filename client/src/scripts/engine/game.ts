import { BaseGameObject2D, DefaultEvents, DefaultEventsMap2D, Game2D, Numeric, Particle2D, ParticlesManager2D, v2, Vec2 } from "common/scripts/engine/mod.ts";
import { Camera2D, Container2D, Sprite2D, type Renderer } from "./renderer.ts";
import { ResourcesManager } from "./resources.ts";
import { KeyListener, MousePosListener } from "./keys.ts";
import { SoundManager } from "./sounds.ts";
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
export class ABParticle2D extends ClientParticle2D{
    speed:number
    initial_speed:number
    speed_to?:number

    angle:number
    initial_angle:number
    angle_to?:number

    dire:number
    initial_dire:number
    dire_to?:number

    sprite:Sprite2D=new Sprite2D()
    
    initial_scale:number
    scale_to?:number

    life_time:number
    ticks=0
    private sprite_id:string
    constructor(sprite:string,position:Vec2,speed:number,angle:number,direction:number,life_time:number=10,zIndex:number=0,scale:number=1,to?:{dire?:number,scale?:number,speed?:number,angle?:number}){
        super()
        this.sprite_id=sprite
        this.container.position=v2.duplicate(position)
        this.speed=speed
        this.initial_speed=speed
        this.angle=angle
        this.initial_angle=angle
        this.container.rotation=this.angle
        this.dire=direction
        this.initial_dire=direction
        this.container.zIndex=zIndex
        this.life_time=life_time
        this.container.scale=v2.new(scale,scale)
        this.scale=scale
        this.initial_scale=scale
        if(to){
            this.speed_to=to.speed
            this.angle_to=to.angle
            this.dire_to=to.dire
            this.scale_to=to.scale
        }
    }
    override update(dt: number): void {
        this.ticks+=dt
        if(this.ticks>=this.life_time){
            this.destroyed=true
        }

        const tt=this.ticks/this.life_time
        if(this.speed_to){
            this.speed=Numeric.lerp(this.initial_speed,this.speed_to,tt)
        }
        if(this.angle_to){
            this.angle=Numeric.lerp(this.initial_angle,this.angle_to,tt)
            this.container.rotation=this.angle
        }
        if(this.dire_to){
            this.dire=Numeric.lerp(this.initial_dire,this.dire_to,tt)
        }
        if(this.scale_to){
            this.scale=Numeric.lerp(this.initial_scale,this.scale_to,tt)
            this.container.scale.x+=this.scale
            this.container.scale.y+=this.scale
        }

        const vel=v2.scale(v2.from_RadAngle(this.dire),this.speed*dt)
        this.container.rotation=this.angle
        this.container.position.x+=vel.x
        this.container.position.y+=vel.y

    }
    override on_create(): void {
        super.on_create()
        this.sprite.sprite=(this.manager.game as unknown as ClientGame2D).resources.get_sprite(this.sprite_id)
        this.container.add_child(this.sprite)
        this.container.visible=true
    }
}
export class ClientGame2D<Events extends DefaultEvents = DefaultEvents, EMap extends DefaultEventsMap2D = DefaultEventsMap2D> extends Game2D<ClientGameObject2D,Events,EMap>{
    camera:Camera2D
    renderer:Renderer
    key:KeyListener
    mouse:MousePosListener
    resources:ResourcesManager

    particles:ParticlesManager2D<ClientParticle2D>

    sounds:SoundManager
    constructor(keyl:KeyListener,mouse:MousePosListener,resources:ResourcesManager,sounds:SoundManager,renderer:Renderer,objects:Array<new ()=>ClientGameObject2D>=[]){
        super(60,objects)
        this.sounds=sounds
        this.mouse=mouse
        this.key=keyl
        this.renderer=renderer
        this.resources=resources
        this.camera=new Camera2D(renderer)
        this.particles=new ParticlesManager2D(this as unknown as Game2D)
    }
    draw(renderer:Renderer,dt:number){
        renderer.clear()
        this.camera.update()
        this.camera.container.draw(renderer)
        this.on_render(dt)
        for(const c in this.scene.objects.objects){
            for(const o of this.scene.objects.objects[c].orden){
                this.scene.objects.objects[c].objects[o].render(this.camera,renderer,dt)
            }
        }
    }
    on_render(_dt:number){

    }
    override on_update(dt:number){
        this.draw(this.renderer,dt)
        this.particles.update(dt)
        this.sounds.update(dt)
        this.key.tick()
    }
}