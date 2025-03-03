import { mergeDeep, splitPath } from "./utils.ts";
export interface Definition{
    idString:string,
    idNumber?:number
}
export class DefinitionsSimple<Type,Base=null>{
    public value:Record<string,Type&Base>
    public valueNumber:Record<number,Type&Base>
    protected did=0
    forall?:(obj:Type&Partial<Base>)=>void
    constructor(forall?:(obj:Type&Partial<Base>)=>void){
        this.value={}
        this.valueNumber={}
        this.forall=forall
    }
    set(val:Type,id:string,n:number|undefined=undefined):number{
        if(this.forall)this.forall(val as (Type&Partial<Base>))
        this.value[id]=val as (Type&Base)
        this.valueNumber[n??this.did]=val as (Type&Base)
        this.did++;
        return this.did
    }
    getFromString(id:string):Type{
        return this.value[id]
    }
    getFromNumber(id:number):Type{
        return this.valueNumber[id]
    }
    exist(id:string):boolean{
        return Object.hasOwn(this.value,id)
    }
    extends(extend:string,val:Type,id:string){
        this.set(mergeDeep<Type>(val,this.getFromString(extend)!),id)
    }
}
export class Definitions<Type extends Definition,Base> extends DefinitionsSimple<Type,Base>{
    insert(...val:Type[]):void{
        for(const vv of val){
            if(this.forall)this.forall(vv as (Type&Partial<Base>))
            this.value[vv.idString]=vv as (Type&Base)
            if(vv.idNumber===undefined){
                vv.idNumber=this.did
                this.valueNumber[this.did]=vv as (Type&Base)
                this.did++
            }else{
                this.valueNumber[vv.idNumber]=vv as (Type&Base)
            }
        }
    }
}
export class Tree<Type,Base> extends DefinitionsSimple<Type,Base>{
    childs:Record<string,Tree<Type,Base>>
    constructor(forall?:(tp:Type&Partial<Base>)=>void){
        super(forall)
        this.childs={}
    }
    define_tree(name:string):Tree<Type,Base>{
        Object.defineProperty(this.childs,name,{
            value:new Tree<Type,Base>(this.forall)
        })
        return this.childs[name]
    }
    get_tree(name:string):Tree<Type,Base>{
        return this.childs[name]
    }
    delete_tree(name:string){
        delete this.childs[name]
    }
    list_tree():string[]{
        return Object.keys(this.childs)
    }
    exist_tree(tree:string):boolean{
        return this.childs[tree]!=undefined
    }
    //** mysub/sub/1 */
    get_item(name:string):Type|undefined{
        const divisions:string[]=splitPath(name)
        // deno-lint-ignore no-this-alias
        let act:Tree<Type,Base>=this
        for(let i=0;i<divisions.length;i++){
            const d=divisions[i]
            if(act.exist_tree(d)){
                act=this.get_tree(d)
            }else if(act.value[d]!=undefined){
                return act.value[d]
            }else{
                return undefined
            }
        }
    }
}
export class ExtendedMap<K, V> extends Map<K, V> {
    private _get(key: K): V {
        // it's up to callers to verify that the key is valid
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return super.get(key)!
    }

    /**
     * Retrieves the value at a given key, placing (and returning) a user-defined
     * default value if no mapping for the key exists
     * @param key      The key to retrieve from
     * @param fallback A value to place at the given key if it currently not associated with a value
     * @returns The value emplaced at key `key`; either the one that was already there or `fallback` if
     *          none was present
     */
    getAndSetIfAbsent(key: K, fallback: V): V {
        // pretty obvious why this is okay
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (this.has(key)) return this.get(key)!

        this.set(key, fallback)
        return fallback
    }

    /**
     * Retrieves the value at a given key, placing (and returning) a user-defined
     * default value if no mapping for the key exists
     * @param key      The key to retrieve from
     * @param fallback A function providing a value to place at the given key if it currently not
     *                 associated with a value
     * @returns The value emplaced at key `key`; either the one that was already there
     *          or the result of `fallback` if none was present
     */
    getAndGetDefaultIfAbsent(key: K, fallback: () => V): V {
        // pretty obvious why this is okay
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (this.has(key)) return this.get(key)!

        const value = fallback()
        this.set(key, value)
        return value
    }

    ifPresent(key: K, callback: (obstacle: V) => void): void {
        this.ifPresentOrElse(key, callback, () => { /* no-op */ })
    }

    ifPresentOrElse(key: K, callback: (obstacle: V) => void, ifAbsent: () => void): void {
        const mappingPresent = super.has(key)

        if (!mappingPresent) {
            return ifAbsent()
        }

        callback(this._get(key))
    }

    mapIfPresent<U = V>(key: K, mapper: (value: V) => U): U | undefined {
        if (!super.has(key)) return undefined

        return mapper(this._get(key))
    }
}
export interface Language{
    name:string,
    // deno-lint-ignore no-explicit-any
    value:Record<string,any>
}
export class LocalizatorDefs{
    language:Language
    constructor(language:Language){
        this.language=language
    }
    // deno-lint-ignore no-explicit-any
    protected _get(val:string[],vv:Record<string,any>,err:string):string{
        if(val.length==1){
            return vv[val[0]]
        }else if(val.length>1){
            if(typeof vv[val[0]]!=="object")return err
            // deno-lint-ignore no-explicit-any
            return this._get(val.slice(1,val.length),(vv[val[0]] as Record<string,any>),err)
        }
        throw new Error("Null Translation")
    }
    /**
     * mydivision.sub.aaa
     */
    get(val:string):string{
        return this._get(val.split("."),this.language.value,val)
    }
}