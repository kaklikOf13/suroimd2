import { v2, Vec2 } from "./geometry.ts"
import { type Hitbox2D, NullHitbox2D } from "./hitbox.ts"
import { type ID } from "./utils.ts"
import { NetStream } from "./stream.ts";
import { random } from "./random.ts";
import { ObjectsPacket } from "./packets.ts";
export type GameObjectID=ID
export abstract class BaseObject2D{
    public hb:Hitbox2D
    public destroyed:boolean
    public id!:GameObjectID
    public category!:number
    public calldestroy:boolean=true
    public dirty:boolean=false
    public dirtyPart:boolean=false
    abstract numberType:number
    abstract stringType:string
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
    abstract update(dt:number):void
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
    netSync={
        deletion:true,
        dirty:true,
        creation:true,
    }
    encodeObject(full:boolean,stream:NetStream){
        const bools=[
            (full||this.dirtyPart)&&this.netSync.dirty,//Dirty Part
            (full||this.dirty)&&this.netSync.dirty,//Dirty Full
            this.destroyed&&this.netSync.deletion,//Dirty Deletion
            this.netSync.creation//Dirty Creation
        ]
        stream.writeBooleanGroup(bools[0],bools[1],bools[2],bools[3])
        if(bools[0]||bools[1]||bools[2]){
            stream.writeID(this.id)
            stream.writeUint16(this.numberType)
            if(bools[0]||bools[1]){
                const data=this.getData()
                const e=this.manager.encoders[this.stringType]
                if(!e)return
                e.encode(bools[1],data,stream)
                if(!full){
                    this.dirty=false
                    this.dirtyPart=false
                }
            }
        }
    }
}

export interface ObjectKey {category:number,id:GameObjectID}
export interface Category2D<GameObject extends BaseObject2D> {objects:Record<GameObjectID,GameObject>,orden:number[]}
export class CellsManager2D<GameObject extends BaseObject2D=BaseObject2D>{
    objects:Record<number,Record<GameObjectID,GameObject>>={}
    categorys:number[]=[]
    cellSize:number
    cells:Record<number,Record<number,Record<number,Record<number,GameObject>>>>
    objectCells:Record<number,Record<number,Vec2[]>>={}
    constructor(cellSize:number=5){
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
        this.updateObject(obj)
    }
    unregistry(obj:ObjectKey){
        if(!(this.objects[obj.category]&&this.objects[obj.category][obj.id])){
            throw new Error(`Invalid Object ${obj}`)
        }
        this.removeObjectFromCells(obj)
        delete this.objects[obj.category][obj.id]
    }
    private removeObjectFromCells(key:ObjectKey){
        if(!this.objectCells[key.category][key.id])return
        for(const c of this.objectCells[key.category][key.id]){
            delete this.cells[key.category][c.y][c.x][key.id]
        }
        delete this.objectCells[key.category][key.id]
    }
    updateObject(obj:GameObject){
        const k=obj.get_key()
        this.removeObjectFromCells(k)
        const cp=this.cellPos(obj.position)
        if(!this.cells[k.category][cp.y]){
            this.cells[k.category][cp.y]={}
        }
        if(!this.cells[k.category][cp.y][cp.x]){
            this.cells[k.category][cp.y][cp.x]={}
        }
        this.cells[k.category][cp.y][cp.x][obj.id]=obj

        //Objects
        const rect=obj.hb.toRect()
        let min = this.cellPos(rect.position)
        let max = this.cellPos(v2.add(rect.position,rect.size))
        if(v2.less(max,min)){
            const m=min
            min=max
            max=m
        }
        this.objectCells[k.category][k.id]=[]
        for(let y=min.y;y<=max.y;y++){ 
            if(!this.cells[k.category][y])this.cells[k.category][y]={}
            for(let x=min.x;x<=max.x;x++){
                if(!this.cells[k.category][y][x])this.cells[k.category][y][x]={}
                this.cells[k.category][y][x][k.id]=obj
                this.objectCells[k.category][k.id].push(v2.new(x,y))
            }
        }
    }
    get_objects(hitbox:Hitbox2D,categorys:number[]):GameObject[]{
        /*const rect=hitbox.toRect()
        let min = this.cellPos(rect.position)
        let max = this.cellPos(v2.add(rect.position,rect.size))
        if(v2.less(max,min)){
            const m=min
            min=max
            max=m
        }
        const objects:GameObject[] = []
        for (const c of categorys) {
            if(!this.cells[c])continue
            for(let y=min.y;y<=max.y;y++){  
                if(!this.cells[c][y])continue
                    for(let x=min.x;x<=max.x;x++){
                        if(!this.cells[c][y][x]){
                            continue
                        }
                        objects.push(...this.cells[c][y][x])
                    }
                }
        }
        return objects*/

        const cp=this.cellPos(hitbox.position)
        const objects:GameObject[] = []
        for (const c of categorys) {
            if(!this.cells[c]||!this.cells[c][cp.y]||!this.cells[c][cp.y][cp.x])continue
            objects.push(...Object.values(this.cells[c][cp.y][cp.x]))
        }
        return objects
    }
    get_objects2(hitbox:Hitbox2D,category:number):GameObject[]{
        const objects:GameObject[] = []
        const cp=this.cellPos(hitbox.position)
        objects.push(...Object.values(this.cells[category][cp.y][cp.x]))
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
    objects:Record<number,Category2D<GameObject>>={}
    categorys:number[]=[]
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
    add_object(obj:GameObject,category:number,id?:number,args?:Record<string,any>,sv:Record<string,any>={}):GameObject{
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
        this.categorys.push(category)
        this.cells.categorys.push(category)
        this.cells.cells[category]={}
        this.cells.objectCells[category]={}
    }
    proccess(packet:ObjectsPacket){
        const csize=packet.stream.readUint16()
        for(let i=0;i<csize;i++){
            const category=packet.stream.readUint8()
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
                    if(b[3]&&!obj&&!b[2]){
                        const obb=this.oncreate({category:category,id:oid},tp)
                        if(!obb)break
                        obj=obb
                        this.add_object(obj,category,oid)
                    }
                    if(obj){
                        if(b[0]||b[1]){
                            const enc=this.encoders[obj.stringType]
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
    encode(size:number=1024*1024,full:boolean=false,encodeList?:Record<number,number[]>):ObjectsPacket{
        const stream=new NetStream(new ArrayBuffer(size))
        if(encodeList){
            stream.writeUint16(Object.keys(encodeList).length)
            for(const c in encodeList){
                // deno-lint-ignore ban-ts-comment
                //@ts-ignore
                stream.writeUint8(c)
                stream.writeUint24(encodeList[c].length)
                for(let j=0;j<encodeList[c].length;j++){
                    const o=encodeList[c][j]
                    const obj=this.objects[c].objects[o]
                    obj.encodeObject(full,stream)
                }
            }
        }else{
            stream.writeUint16(this.categorys.length)
            for(const c of this.categorys){
                stream.writeUint8(c)
                stream.writeUint24(this.objects[c].orden.length)
                for(let j=0;j<this.objects[c].orden.length;j++){
                    const o=this.objects[c].orden[j]
                    const obj=this.objects[c].objects[o]
                    obj.encodeObject(full,stream)
                }
            }
        }
        const op=new ObjectsPacket()
        op.stream=stream
        op.size=stream.index
        return op
    }
    update(dt:number){
        for(const c in this.objects){
            for(let j=0;j<this.objects[c].orden.length;j++){
                const o=this.objects[c].orden[j]
                const obj=this.objects[c].objects[o]
                if(obj.destroyed)continue
                obj.update(dt)
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