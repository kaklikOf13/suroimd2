import { Clock, cloneDeep } from "./utils.ts"
import { BaseObject2D, type CellsManager2D, GameObjectManager2D } from "./gameObject.ts"
import { type Vec2 } from "./geometry.ts";
import { Definitions } from "./definitions.ts";
export enum DefaultEvents{
    GameTick="game-tick",
    GameRun="game-run"
}
export interface DefaultEventsMap2D{
    // deno-lint-ignore no-explicit-any
    [DefaultEvents.GameRun]:Game2D<any,any,any>
    // deno-lint-ignore no-explicit-any
    [DefaultEvents.GameTick]:Game2D<any,any,any>
}
export abstract class Game2DPlugin<Events extends DefaultEvents,Map extends DefaultEventsMap2D>{
    // deno-lint-ignore no-explicit-any
    public game!:Game2D<any,any,any>
    // deno-lint-ignore no-explicit-any
    constructor(game:Game2D<any,any,any>){
        this.game=game
    }
    abstract init_signals():void
    on<Ev extends Events>(signal: Ev, cb?: (data: Map[Ev]) => void){
        this.game.events.on(signal,cb)
    }
}
export type EventHandlers<Events extends DefaultEvents=DefaultEvents,EventDataMap extends DefaultEventsMap2D=DefaultEventsMap2D>=Record<Events|DefaultEvents,Array<(data: EventDataMap[Events]) => void>>
export class EventsManager<Events extends DefaultEvents,Map extends DefaultEventsMap2D> {
    signals:Partial<EventHandlers<Events,Map>>

    constructor() {
        this.signals={}
    }

    on<Ev extends Events>(signal: Ev|DefaultEvents, cb?: (data: Map[Ev]) => void): void {
        ((this.signals[signal] as Array<typeof cb> | undefined) ??= []).push(cb);
    }

    off<Ev extends Events>(eventType: Ev|DefaultEvents, cb?: (data: Map[Ev]) => void): void {
        if (!cb) {
            delete this.signals[eventType];
            return;
        }

        (this.signals[eventType] as Array<typeof cb> | undefined)!.splice((this.signals[eventType] as Array<typeof cb> | undefined)!.indexOf(cb),1);
    }

    emit<Ev extends Events>(eventType: Ev|DefaultEvents, data: Map[Ev]): void {
        for (const cb of this.signals[eventType]||[]) {
            if(cb){
                cb(data)
            }
        }
    }

    clear(eventType: Events): void {
        this.signals[eventType]=[]
    }
    clearAll(): void {
        this.signals={}
    }
}
export abstract class BaseGameObject2D extends BaseObject2D{
    // deno-lint-ignore no-explicit-any
    public game!:Game2D<any,any,any>
    constructor(){
        super()
    }
}
export interface Scene2D{
    cellsSize?:number
    objects:Record<string,Array<{
        type:string,
        position?:Vec2
        scale?:Vec2
        rotation?:number
        // deno-lint-ignore no-explicit-any
        vals?:Record<string,any>
        id?:number
    }>>
}

export class Scene2DInstance<DefaultGameObject extends BaseGameObject2D=BaseGameObject2D,Events extends DefaultEvents=DefaultEvents,Map extends DefaultEventsMap2D=DefaultEventsMap2D>{
    readonly scene:Scene2D
    readonly objects:GameObjectManager2D<DefaultGameObject>
    readonly cells:CellsManager2D<DefaultGameObject>
    readonly game:Game2D<DefaultGameObject,Events,Map>
    constructor(scene:Scene2D,game:Game2D<DefaultGameObject,Events,Map>){
        this.scene=scene
        this.objects=new GameObjectManager2D<DefaultGameObject>(scene.cellsSize)
        this.cells=this.objects.cells
        this.game=game
        this.reset()
    }
    reset(){
        this.objects.clear()
        // deno-lint-ignore no-explicit-any
        this.objects.add_object=(obj: DefaultGameObject, category: string, id?: number | undefined, args?: Record<string, any> | undefined, sv?: Record<string, any>)=>{
            obj.game=this.game
            return GameObjectManager2D.prototype.add_object.call(this.objects,obj,category,id,args,sv)
        }
        this.objects.oncreate=(_k,t)=>{
            return new (this.game.objects.getFromNumber(t))()
        }
        for(const c in this.scene.objects){
            this.objects.add_category(c)
            for(const o of this.scene.objects[c]){
                const obj=this.objects.add_object(new (this.game.objects.get(o.type))(),c,o.id,o.vals,{"game":this.game})
                if(o.position)obj.position=cloneDeep(o.position as Vec2)
            }
        }
    }
}
export abstract class Game2D<DefaultGameObject extends BaseGameObject2D=BaseGameObject2D,Events extends DefaultEvents=DefaultEvents,Map extends DefaultEventsMap2D=DefaultEventsMap2D>{
    readonly tps:number

    private readonly clock:Clock
    running:boolean=true
    readonly events:EventsManager<Events,Map>
    scene:Scene2DInstance<DefaultGameObject,Events,Map>
    clock_e:boolean=true
    objects:Definitions<new()=>DefaultGameObject>=new Definitions()
    constructor(tps: number,objects:Array<new()=>DefaultGameObject>){
        this.tps=tps
        this.events=new EventsManager()
        this.clock=new Clock(tps,1,this.update.bind(this))
        for(const o of objects){
            const oi= new o()
            this.objects.set(o,oi.objectType,oi.numberType)
        }
        this.scene=new Scene2DInstance<DefaultGameObject,Events,Map>({objects:{}},this)
    }
    add_plugin(plugin:Game2DPlugin<Events,Map>){
        plugin.game=this
        plugin.init_signals()
    }
    clear_plugins(){
        this.events.clearAll()
    }
    update() {
        this.on_update()
        this.scene.objects.update()
        this.events.emit(DefaultEvents.GameTick,this)
        if(this.clock_e){
            this.clock.tick()
        }else{
            self.requestAnimationFrame(this.update.bind(this))
        }
    }
    on_update():void{}
    on_run():void{}
    mainloop(){
        // Start
        this.on_run()
        this.events.emit(DefaultEvents.GameRun,this)
        // Mainloop
        this.update()
    }
    instantiate(scene:Scene2D):Scene2DInstance<DefaultGameObject,Events,Map>{
        return new Scene2DInstance<DefaultGameObject,Events,Map>(scene,this)
    }
}