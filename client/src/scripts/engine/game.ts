import { BaseGameObject2D, DefaultEvents, DefaultEventsMap2D, Game2D, v2 } from "common/scripts/engine/mod.ts";
import { Camera2D,  Material2D, Renderer } from "./renderer.ts";
import { ResourcesManager } from "./resources.ts";
import { KeyListener, MousePosListener } from "./keys.ts";
export abstract class ClientGameObject2D extends BaseGameObject2D{
    // deno-lint-ignore no-explicit-any
    declare game:ClientGame2D<any,any>
    
    constructor(){
        super()
    }
    abstract render(camera:Camera2D,renderer:Renderer):void
}
export abstract class FormGameObject2D extends ClientGameObject2D{
    // deno-lint-ignore no-explicit-any
    declare game:ClientGame2D<any,any>
    abstract material:Material2D
    zIndex:number=0
    constructor(){
        super()
    }
    render(camera:Camera2D,renderer:Renderer){
        renderer.draw_hitbox2D(this.hb,this.material,camera.position,this.zIndex)
    }
}
export class ClientGame2D<Events extends DefaultEvents = DefaultEvents, EMap extends DefaultEventsMap2D = DefaultEventsMap2D> extends Game2D<ClientGameObject2D,Events,EMap>{
    camera:Camera2D={position:v2.new(0,0),zoom:1}
    renderer:Renderer
    key:KeyListener
    mouse:MousePosListener
    resources:ResourcesManager
    constructor(keyl:KeyListener,mouse:MousePosListener,resources:ResourcesManager,renderer:Renderer,objects:Array<new ()=>ClientGameObject2D>=[]){
        super(0,objects)
        this.mouse=mouse
        this.key=keyl
        this.renderer=renderer
        this.resources=resources
    }
    draw(renderer:Renderer){
        renderer.clear()
        this.on_render()
        for(const c in this.scene.objects.objects){
            for(const o of this.scene.objects.objects[c].orden){
                this.scene.objects.objects[c].objects[o].render(this.camera,renderer)
            }
        }
    }
    on_render(){

    }
    on_update(){
        this.draw(this.renderer)
        this.key.tick()
    }
}