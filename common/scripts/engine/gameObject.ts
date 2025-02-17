import { v2, Vec2 } from "./geometry.ts"
import { type Hitbox2D, NullHitbox2D } from "./hitbox.ts"
import { type ID, type Tags } from "./utils.ts"
import { NetStream } from "./stream.ts";
import { random } from "./random.ts";
import { ObjectsPacket } from "./packets.ts";
export type GameObjectID=ID
export abstract class BaseObject2D{
    public hb:Hitbox2D
    public destroyed:boolean
    public id!:GameObjectID
    public category!:string
    public calldestroy:boolean=true
    public dirty:boolean=false
    public dirtyPart:boolean=false
    abstract numberType:number
    abstract objectType:string
    // deno-lint-ignore no-explicit-any
    public manager!:GameObjectManager2D<any>
    public get position():Vec2{
        return this.hb ? this.hb.position : v2.new(0,0)
    }
    set position(val:Vec2){
        this.hb.position=val
    }
    constructor(){
        this.hb=new NullHitbox2D()
        this.destroyed=false
    }
    updateData(_data:EncodedData):void{}
    getData():EncodedData{return {full:{}}}
    abstract update():void
    // deno-lint-ignore no-explicit-any
    abstract create(args:Record<string,any>):void
    onDestroy():void{}
    destroy():void{
        if(this.destroyed)return
        this.destroyed=true
        this.manager.destroy_queue.push(this)
    }
    get_key():ObjectKey{
        return {category:this.category,id:this.id}
    }
    sendDelete=true
}

export interface ObjectKey {category:string,id:GameObjectID}
export interface Category2D<GameObject extends BaseObject2D> {objects:Record<GameObjectID,GameObject>,orden:number[]}
export class CellsManager2D<GameObject extends BaseObject2D=BaseObject2D>{
    objects:Record<string,Record<GameObjectID,GameObject>>={}
    cellSize:number
    cells:Record<number,Record<number,Record<string,GameObject[]>>>
    constructor(cellSize:number=8){
        this.cellSize=cellSize
        this.cells={}
    }

    registry(obj:GameObject){
        if(!this.objects[obj.category]){
            this.objects[obj.category]={}
        }
        if(this.objects[obj.category][obj.id]){
            throw new Error(`Existent Object ${obj.id} In Cell`)
        }
        this.objects[obj.category][obj.id]=obj
    }
    unregistry(obj:ObjectKey){
        if(!(this.objects[obj.category]&&this.objects[obj.category][obj.id])){
            throw new Error(`Invalid Object ${obj}`)
        }
        delete this.objects[obj.category][obj.id]
    }
    update(){
        this.cells={}
        for(const c of Object.keys(this.objects)){
            for(const obj of Object.values(this.objects[c])){
                const rect=obj.hb.toRect()
                let min = this.cellPos(rect.position)
                let max = this.cellPos(v2.add(rect.position,rect.size))
                if(v2.less(max,min)){
                    const m=min
                    min=max
                    max=m
                }
                for(let y=min.y;y<=max.y;y++){
                    if(!this.cells[y]){
                        this.cells[y]={}
                    }
                    for(let x=min.x;x<=max.x;x++){
                        if(!this.cells[y][x]){
                            this.cells[y][x]={}
                        }
                        if(!(this.cells[y][x][obj.category])){
                            this.cells[y][x][obj.category]=[]
                        }
                        this.cells[y][x][obj.category].push(obj)
                    }
                }
            }
        }
    }
    get_objects(hitbox:Hitbox2D,categorys:Tags):GameObject[]{
        const rect=hitbox.toRect()
        let min = this.cellPos(rect.position)
        let max = this.cellPos(v2.add(rect.position,rect.size))
        if(v2.less(max,min)){
            const m=min
            min=max
            max=m
        }
        const objects:GameObject[] = [];
        for(let y=min.y;y<=max.y;y++){
            if(!this.cells[y])continue
            for(let x=min.x;x<=max.x;x++){
                if(!this.cells[y][x])continue
                for (const c of categorys) {
                    if(!this.cells[y][x][c]){
                        continue
                    }
                    objects.push(...this.cells[y][x][c])
                }
            }
        }
        return objects
    }
    get_objects2(hitbox:Hitbox2D,categorys:string):GameObject[]{
        const rect=hitbox.toRect()
        let min = this.cellPos(rect.position)
        let max = this.cellPos(v2.add(rect.position,rect.size))
        if(v2.less(max,min)){
            const m=min
            min=max
            max=m
        }
        const objects:GameObject[] = []
        for(let y=min.y;y<=max.y;y++){
            if(!this.cells[y])continue
            for(let x=min.x;x<=max.x;x++){
                if(!(this.cells[y][x]&&this.cells[y][x][categorys]))continue
                objects.push(...this.cells[y][x][categorys])
            }
        }
        return objects
    }
    cellPos(pos:Vec2):Vec2{
        return v2.floor(v2.dscale(pos,this.cellSize))
    }
}
export type EncodedData={
    // deno-lint-ignore ban-types
    full?:Object
}
export interface ObjectEncoder{
    encode:(full:boolean,data:EncodedData,stream:NetStream)=>void
    decode:(full:boolean,stream:NetStream)=>EncodedData
}
export class GameObjectManager2D<GameObject extends BaseObject2D>{
    cells:CellsManager2D<GameObject>
    objects:Record<string,Category2D<GameObject>>={}
    encoders:Record<string,ObjectEncoder>={}
    ondestroy:(obj:GameObject)=>void=(_)=>{}
    oncreate:(_key:ObjectKey,_type:number)=>GameObject|undefined
    destroy_queue:GameObject[]=[]
    constructor(cellsSize?:number,oncreate?:((_key:ObjectKey,_type:number)=>GameObject|undefined)){
        this.cells=new CellsManager2D(cellsSize)
        this.oncreate=oncreate??((_k,_t)=>{return undefined})
    }
    clear(){
        for(const c in this.objects){
            for(let j=0;j<this.objects[c].orden.length;j++){
                const o=this.objects[c].orden[j]
                this.unregister(this.objects[c].objects[o].get_key())
            }
        }
        this.objects={}
    }

    // deno-lint-ignore no-explicit-any
    add_object(obj:GameObject,category:string,id?:number,args?:Record<string,any>,sv:Record<string,any>={}):GameObject{
        if(!this.objects[category]){
            throw new Error(`Invalid Category ${category}`)
        }
        if(id===undefined){
            while(id===undefined){
                id=random.id()
                if(this.objects[category].objects[id]){
                    id=undefined
                }
            }
        }
        obj.id=id
        obj.category=category
        obj.dirty=true
        obj.dirtyPart=true
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        obj.manager=this
        this.objects[category].objects[obj.id]=obj
        this.objects[category].orden.push(obj.id)
        for(const i in sv){
            // deno-lint-ignore ban-ts-comment
            //@ts-expect-error
            obj[i]=sv[i]
        }
        obj.create(args??{})
        this.cells.registry(obj)
        return obj
    }
    get_object(obj:ObjectKey):GameObject{
        return this.objects[obj.category].objects[obj.id]
    }
    exist(obj:ObjectKey):boolean{
        return Object.hasOwn(this.objects,obj.category)&&Object.hasOwn(this.objects[obj.category].objects,obj.id)
    }
    alive_count(category:keyof typeof this.objects):number{
        return this.objects[category].orden.length
    }
    add_category(category:keyof typeof this.objects){
        this.objects[category]={orden:[],objects:{}}
    }
    proccess(packet:ObjectsPacket){
        const csize=packet.stream.readUint16()
        for(let i=0;i<csize;i++){
            const category=packet.stream.readString()
            if(!this.objects[category]){
                this.add_category(category)
            }
            const osize=packet.stream.readUint24()
            for(let j=0;j<osize;j++){
                const b=packet.stream.readBooleanGroup()
                if(b[0]||b[1]||b[2]){
                    const oid=packet.stream.readID()
                    const tp=packet.stream.readUint16()
                    let obj=this.objects[category].objects[oid]
                    if(!obj&&!b[2]){
                        const obb=this.oncreate({category:category,id:oid},tp)
                        if(!obb)break
                        obj=obb
                        this.add_object(obj,category,oid)
                    }
                    if(obj){
                        if(b[0]||b[1]){
                            const enc=this.encoders[obj.objectType]
                            const data=enc.decode(b[1],packet.stream)
                            obj.updateData(data)
                        }
                        if(b[2]){
                            obj.destroy()
                        }
                    }
                }
            }
        }
    }
    encode(size:number=1024*1024,full:boolean=false):ObjectsPacket{
        const stream=new NetStream(new ArrayBuffer(size))
        stream.writeUint16(Object.keys(this.objects).length)
        for(const c in this.objects){
            stream.writeString(c)
            stream.writeUint24(this.objects[c].orden.length)
            for(let j=0;j<this.objects[c].orden.length;j++){
                const o=this.objects[c].orden[j]
                const obj=this.objects[c].objects[o]
                const enc=this.encoders[obj.objectType]
                if(!enc)continue
                const bools=[full||obj.dirtyPart,full||obj.dirty,obj.destroyed&&obj.sendDelete]
                stream.writeBooleanGroup(bools[0],bools[1],bools[2])
                if(bools[0]||bools[1]||bools[2]){
                    stream.writeID(o)
                    stream.writeUint16(obj.numberType)
                    if(bools[0]||bools[1]){
                        const data=obj.getData()
                        enc.encode(bools[1],data,stream)
                        if(!full){
                            obj.dirty=false
                            obj.dirtyPart=false
                        }
                    }
                }
            }
        }
        const op=new ObjectsPacket()
        op.stream=stream
        op.size=stream.index
        return op
    }
    update(){
        this.cells.update()
        for(const c in this.objects){
            for(let j=0;j<this.objects[c].orden.length;j++){
                const o=this.objects[c].orden[j]
                const obj=this.objects[c].objects[o]
                if(obj.destroyed)continue
                obj.update()
            }
        }
    }
    apply_destroy_queue(){
        for(const obj of this.destroy_queue){
            this.unregister(obj.get_key())
            delete this.objects[obj.category].objects[obj.id]
            this.objects[obj.category].orden.splice(this.objects[obj.category].orden.indexOf(obj.id),1)
        }
        this.destroy_queue.length=0
    }
    unregister(k:ObjectKey){
        if(this.objects[k.category].objects[k.id].calldestroy){
            this.ondestroy(this.objects[k.category].objects[k.id])
            this.objects[k.category].objects[k.id].onDestroy()
        }
        this.cells.unregistry(this.objects[k.category].objects[k.id].get_key())
    }
}