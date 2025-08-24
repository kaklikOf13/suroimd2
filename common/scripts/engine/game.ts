import { Clock, cloneDeep, SignalManager } from "./utils.ts"
import { BaseObject2D, type CellsManager2D, GameObjectManager2D } from "./gameObject.ts"
import { type Vec2 } from "./geometry.ts";
import { DefinitionsSimple } from "./definitions.ts";
export abstract class BaseGameObject2D extends BaseObject2D{
    // deno-lint-ignore no-explicit-any
    public game!:Game2D<any>
    constructor(){
        super()
    }
}
export interface Scene2D{
    cellsSize?:number
    objects:Record<number,Array<{
        type:string,
        position?:Vec2
        scale?:Vec2
        rotation?:number
        // deno-lint-ignore no-explicit-any
        vals?:Record<string,any>
        id?:number
    }>>
}

export class Scene2DInstance<DefaultGameObject extends BaseGameObject2D=BaseGameObject2D>{
    readonly scene:Scene2D
    readonly objects:GameObjectManager2D<DefaultGameObject>
    readonly cells:CellsManager2D<DefaultGameObject>
    readonly game:Game2D<DefaultGameObject>
    constructor(scene:Scene2D,game:Game2D<DefaultGameObject>){
        this.scene=scene
        this.objects=new GameObjectManager2D<DefaultGameObject>(scene.cellsSize)
        this.cells=this.objects.cells
        this.game=game
        this.reset()
    }
    reset(){
        this.objects.clear()
        // deno-lint-ignore no-explicit-any
        this.objects.add_object=(obj: DefaultGameObject, layer: number, id?: number | undefined, args?: Record<string, any> | undefined, sv?: Record<string, any>)=>{
            obj.game=this.game
            return GameObjectManager2D.prototype.add_object.call(this.objects,obj,layer,id,args)
        }
        this.objects.oncreate=(_id:number,_layer:number,t)=>{
            if(!this.game.objects.getFromNumber(t))return undefined
            return new (this.game.objects.getFromNumber(t))()
        }
        for(const c in this.scene.objects){
            const cc=typeof c==="string"?parseInt(c):c
            this.objects.add_layer(cc)
            for(const o of this.scene.objects[c]){
                const obj=this.objects.add_object(new (this.game.objects.getFromString(o.type))(),cc,o.id,o.vals,{"game":this.game})
                if(o.position)obj.position=cloneDeep(o.position as Vec2)
            }
        }
    }
}

export abstract class Game2D<DefaultGameObject extends BaseGameObject2D=BaseGameObject2D>{
    readonly tps:number

    readonly clock:Clock
    running:boolean=true
    scene:Scene2DInstance<DefaultGameObject>
    destroy_queue:boolean=true
    new_list:boolean=true
    objects:DefinitionsSimple<new()=>DefaultGameObject>=new DefinitionsSimple()

    timeouts:{c:()=>void,delay:number}[]=[]

    request_animation_frame:boolean=false

    signals:SignalManager=new SignalManager()

    constructor(tps: number,objects:Array<new()=>DefaultGameObject>){
        this.tps=tps
        this.clock=new Clock(tps,1,this.update.bind(this))
        for(const o of objects){
            const oi=new o()
            this.objects.set(o,oi.stringType,oi.numberType)
        }
        this.scene=new Scene2DInstance<DefaultGameObject>({objects:{}},this)
    }
    dt:number=0
    last_time:number=0
    update(dt:number) {
        if(this.request_animation_frame){
            const ldt=dt
            dt=(dt-this.last_time)/1000
            this.last_time=ldt
        }
        this.signals.emit("update")
        this.dt=dt
        this.on_update(dt)
        this.scene.objects.update(dt)
        for(let i=0;i<this.timeouts.length;i++){
            this.timeouts[i].delay-=dt
            if(this.timeouts[i].delay<=0){
                this.timeouts[i].c()
                this.timeouts.splice(i,1)
                i--
            }
        }
        if(!this.running){
            this.clock.stop()
            this.on_stop()
        }
        if(this.new_list){
            this.scene.objects.update_to_net()
        }
        if(this.destroy_queue){
            this.scene.objects.apply_destroy_queue()
        }
        
        if(this.request_animation_frame){
            self.requestAnimationFrame(this.update.bind(this))
        }
    }
    addTimeout(callback:()=>void,delay:number):number{
        this.timeouts.push({c:callback,delay:delay})
        return this.timeouts.length-1
    }
    on_update(_dt:number):void{}
    on_run():void{}
    on_stop():void{}
    mainloop(){
        // Start
        this.on_run()
        this.signals.emit("start")
        if(!this.request_animation_frame){
            this.clock.start()
        }else{
            self.requestAnimationFrame(this.update.bind(this))
        }
    }
    instantiate(scene:Scene2D):Scene2DInstance<DefaultGameObject>{
        return new Scene2DInstance<DefaultGameObject>(scene,this)
    }
}