import { v2, Vec2 } from "./geometry.ts"
import { type Hitbox2D, NullHitbox2D } from "./hitbox.ts"
import { type ID } from "./utils.ts"
import { NetStream } from "./stream.ts";
import { random } from "./random.ts";
export type GameObjectID=ID
export abstract class BaseObject2D{
    public hb:Hitbox2D
    public destroyed:boolean
    public id!:GameObjectID
    public layer!:number
    public calldestroy:boolean=true
    public dirty:boolean=false
    public dirtyPart:boolean=false
    public is_new:boolean=true
    abstract numberType:number
    abstract stringType:string
    // deno-lint-ignore no-explicit-any
    public manager!:GameObjectManager2D<any>
    public get position():Vec2{
        return this.hb.position
    }
    set position(val:Vec2){
        this.hb.translate(val)
    }
    constructor(){
        this.hb=new NullHitbox2D(v2.new(0,0))
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
            this.netSync.creation,//Dirty Creation
            this.is_new
        ]
        stream.writeBooleanGroup(bools[0],bools[1],bools[2],bools[3],bools[4])
        if(bools[0]||bools[1]||bools[2]){
            stream.writeID(this.id)
            stream.writeUint8(this.numberType)
            if(bools[0]||bools[1]){
                const data=this.getData()
                const e=this.manager.encoders[this.stringType]
                if(!e)return
                e.encode(bools[1],data,stream)
            }
        }
    }
}

export interface Layer2D<GameObject extends BaseObject2D> {objects:Record<GameObjectID,GameObject>,orden:number[]}
export class CellsManager2D<GameObject extends BaseObject2D = BaseObject2D> {
    cellSize: number;
    cells: Map<string, Set<GameObject>> = new Map();
    objectCells: Map<GameObject, Set<string>> = new Map();

    constructor(cellSize = 5) {
        this.cellSize = cellSize;
    }

    private key(cat: number, x: number, y: number): string {
        return `${cat}:${x}:${y}`;
    }

    private cellPos(pos: Vec2): Vec2 {
        return v2.floor(v2.dscale(pos, this.cellSize));
    }

    registry(obj: GameObject) {
        this.updateObject(obj);
    }

    unregistry(obj: GameObject) {
        this.removeObjectFromCells(obj);
    }

    clear() {
        this.cells.clear();
        this.objectCells.clear();
    }

    private removeObjectFromCells(obj: GameObject) {
        const cells = this.objectCells.get(obj);
        if (!cells) return;

        for (const cellKey of cells) {
            const set = this.cells.get(cellKey);
            if (set) {
                set.delete(obj);
                if (set.size === 0) this.cells.delete(cellKey);
            }
        }
        this.objectCells.delete(obj);
    }

    updateObject(obj: GameObject) {
        this.removeObjectFromCells(obj);

        const rect = obj.hb.toRect();
        const min = this.cellPos(rect.min);
        const max = this.cellPos(rect.max);

        const occupiedCells = new Set<string>();

        for (let y = min.y; y <= max.y; y++) {
            for (let x = min.x; x <= max.x; x++) {
                const cellKey = this.key(obj.layer, x, y);
                if (!this.cells.has(cellKey)) {
                    this.cells.set(cellKey, new Set());
                }
                this.cells.get(cellKey)!.add(obj);
                occupiedCells.add(cellKey);
            }
        }

        this.objectCells.set(obj, occupiedCells);
    }

    get_objects(hitbox: Hitbox2D, categories: number[]): GameObject[] {
        const rect = hitbox.toRect();
        const min = this.cellPos(rect.min);
        const max = this.cellPos(rect.max);

        const results = new Set<GameObject>();

        for (const c of categories) {
            for (let y = min.y; y <= max.y; y++) {
                for (let x = min.x; x <= max.x; x++) {
                    const set = this.cells.get(this.key(c, x, y));
                    if (set) {
                        for (const obj of set) {
                            results.add(obj);
                        }
                    }
                }
            }
        }
        return [...results];
    }

    get_objects2(hitbox: Hitbox2D, category: number): GameObject[] {
        return this.get_objects(hitbox, [category]);
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
    objects:Record<number,Layer2D<GameObject>>={}
    layers:number[]=[]
    encoders:Record<string,ObjectEncoder>={}
    ondestroy:(obj:GameObject)=>void=(_)=>{}
    oncreate:(_id:number,_layer:number,_type:number)=>GameObject|undefined
    destroy_queue:GameObject[]=[]
    new_objects:GameObject[]=[]
    constructor(cellsSize?:number,oncreate?:((_id:number,_layer:number,_type:number)=>GameObject|undefined)){
        this.cells=new CellsManager2D(cellsSize)
        this.oncreate=oncreate??((_k,_t)=>{return undefined})
    }
    clear(){
        for(const l in this.objects){
            for(let j=0;j<this.objects[l].orden.length;j++){
                const o=this.objects[l].orden[j]
                this.objects[l].objects[o].onDestroy()
            }
            this.objects[l].orden.length=0
        }
        this.objects={}
        this.layers=[]
        this.new_objects=[]
        this.destroy_queue=[]
        this.cells.clear()
    }

    add_object(
        obj: GameObject,
        layer: number,
        id?: number,
        args?: Record<string, any>,
        sv: Record<string, any> = {}
    ): GameObject {
        if (!this.objects[layer]) {
            this.add_layer(layer);
        }
        if (id === undefined) {
            do {
                id = random.id();
            } while (this.objects[layer].objects[id]);
        }
        obj.id = id;
        obj.layer = layer;
        obj.dirty = true;
        obj.dirtyPart = true;
        obj.manager = this;

        this.objects[layer].objects[obj.id] = obj;
        this.objects[layer].orden.push(obj.id);

        for (const key in sv) {
            // deno-lint-ignore ban-ts-comment
            // @ts-ignore
            obj[key] = sv[key];
        }
        this.new_objects.push(obj);
        obj.create(args ?? {});
        this.cells.registry(obj);

        return obj;
    }

    get_object(id:number,layer:number):GameObject{
        return this.objects[layer].objects[id]
    }
    exist(id:number,layer:number):boolean{
        return Object.hasOwn(this.objects,layer)&&Object.hasOwn(this.objects[layer].objects,id)
    }
    exist_all(id:number,type:number):boolean{
        for(const l of Object.values(this.objects)){
            if(Object.hasOwn(l.objects,id)&&l.objects[id].numberType===type)return true
        }
        return false
    }
    alive_count(layer:keyof typeof this.objects):number{
        return this.objects[layer].orden.length
    }
    add_layer(layer: number) {
        if (this.objects[layer]) return;
        this.objects[layer] = { orden: [], objects: {} };
        this.layers.push(layer);
    }
    process_object(layer:number,stream:NetStream){
        const b=stream.readBooleanGroup()
        if(b[0]||b[1]||b[2]){
            const oid=stream.readID()
            const tp=stream.readUint8()
            let obj=this.objects[layer].objects[oid]
            if(b[3]&&!obj&&!b[2]){
                const obb=this.oncreate(oid,layer,tp)
                if(!obb)return
                obj=obb
                this.add_object(obj,layer,oid)
            }
            obj.is_new=b[4]
            if(obj){
                if(b[0]||b[1]){
                    const enc=this.encoders[obj.stringType]
                    const data=enc.decode(b[1],stream)
                    obj.updateData(data)
                }
                if(b[2]){
                    obj.destroy()
                }
            }
        }
   }
   proccess_l(stream:NetStream,process_deletion:boolean=false){
        let os=stream.readUint16()
        for(let i=0;i<os;i++){
            const layer=stream.readUint8()
            if(!this.objects[layer]){
                this.add_layer(layer)
            }
            this.process_object(layer,stream)
        }
        /*os=stream.readUint16()
        for(let i=0;i<os;i++){
            const c=stream.readUint8()
            const id=stream.readID()
            if(process_deletion&&this.objects[c]&&this.objects[c].objects[id])this.objects[c].objects[id].destroy()
        }*/
    }
    encode(size:number=1024*1024,full:boolean=false,encodeList?:Record<number,number[]>):NetStream{
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
            stream.writeUint16(this.layers.length)
            for(const c of this.layers){
                stream.writeUint8(c)
                stream.writeUint24(this.objects[c].orden.length)
                for(let j=0;j<this.objects[c].orden.length;j++){
                    const o=this.objects[c].orden[j]
                    const obj=this.objects[c].objects[o]
                    obj.encodeObject(full,stream)
                }
            }
        }
        return stream
    }
    encode_list(l:GameObject[],size:number=1024*1024,last_list:GameObject[]=[]):{last:GameObject[],strm:NetStream}{
        const stream=new NetStream(new ArrayBuffer(size))
        stream.writeUint16(l.length)
        for(let i=0;i<l.length;i++){
            stream.writeUint8(l[i].layer)
            l[i].encodeObject(!last_list.includes(l[i]),stream)
        }
        const deletions=last_list.filter(obj =>
           !l.includes(obj)&&obj.netSync.deletion
        );
        /*stream.writeUint16(deletions.length)
        for(let i=0;i<deletions.length;i++){
            stream.writeUint8(deletions[i].layer)
            stream.writeID(deletions[i].id)
        }*/
        return {strm:stream,last:l}
    }
    update(dt:number){
        for(const l in this.objects){
            for(let j=0;j<this.objects[l].orden.length;j++){
                const o=this.objects[l].orden[j]
                const obj=this.objects[l].objects[o]
                if(obj.destroyed)continue
                obj.update(dt)
            }
        }
    }
    update_to_net(){
        for(const o of this.new_objects){
            o.is_new=false
        }
        for(const l of this.layers){
            for(let j=0;j<this.objects[l].orden.length;j++){
                const idx=this.objects[l].orden[j]
                this.objects[l].objects[idx].dirty=false
                this.objects[l].objects[idx].dirtyPart=false
            }
        }
        this.new_objects.length=0
    }
    apply_destroy_queue(){
        for(const obj of this.destroy_queue){
            this.unregister(obj,true)
            delete this.objects[obj.layer].objects[obj.id]
            this.objects[obj.layer].orden.splice(this.objects[obj.layer].orden.indexOf(obj.id),1)
        }
        this.destroy_queue.length=0
    }
    unregister(obj:GameObject,force_destroy:boolean=false){
        if(this.objects[obj.layer].objects[obj.id].calldestroy||force_destroy){
            this.ondestroy(this.objects[obj.layer].objects[obj.id])
            this.objects[obj.layer].objects[obj.id].onDestroy()
        }
        this.cells.unregistry(this.objects[obj.layer].objects[obj.id])
    }
}