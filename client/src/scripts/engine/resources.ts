import { EaseFunction, ease, v2 } from "common/scripts/engine/mod.ts";
import { type SoundManager } from "./sounds.ts";
import * as PIXI from "pixi.js";
export interface SoundDef{
    volume:number
    src:string
}
export class Sprite{
    texture!:PIXI.Texture
    src:string
    path:string
    readonly resourceType:SourceType.Sprite=SourceType.Sprite
    constructor(src:string,path:string){
        this.path=path
        this.src=src
    }
    free(){
    }
}
export interface KeyFrame{
    ease:EaseFunction
    // deno-lint-ignore no-explicit-any
    value:any
    dest:string
    delay:number
}
export type Animation={
    resourceType:SourceType.Animation
    keys:Record<string,KeyFrame[]>
}
export interface Sound extends SoundDef{
    volume:number
    buffer:AudioBuffer
    resourceType:SourceType.Sound
}
export enum SourceType{
    Sprite,
    Animation,
    Sound,
    Material
}
export type Source=Sprite|Animation|Sound
function getSvgUrl(svg:string) {
    return  URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
}

function loadTexture(source:HTMLImageElement):PIXI.Texture{
    return PIXI.Texture.from(source)
}
export interface SpriteDef{
    path:string
    scale?:number
    variations?:number
}
const default_sprite_src=
`data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFACAYAAADNkKWqAAAACXBIWXMAAD5/AAA+fwFuH9ocAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAABEZJREFUeJzt1jERhFAUBMEPdSnSSBBKctIQADJeMN0KNpraba31LhhyHvf0BML26QEAUwQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIOt3Hvf0BsL+zzU9gTAPEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIEsAQSyBBDIEkAgSwCBLAEEsgQQyBJAIEsAgSwBBLIEEMgSQCBLAIGsD29rB4lxkNocAAAAAElFTkSuQmCC`
export class ResourcesManager{
    sources:Record<string,Source>
    canvas:HTMLCanvasElement
    ctx:CanvasRenderingContext2D
    domp=new DOMParser()
    dome=new XMLSerializer()
    pixi:PIXI.Application
    audioCtx:AudioContext
    soundsManager:SoundManager
    default_sprite:Sprite
    constructor(pixi:PIXI.Application,soundsManager:SoundManager){ 
        this.sources={}
        this.canvas=document.createElement("canvas")
        this.ctx=this.canvas.getContext("2d")!
        this.pixi=pixi
        this.audioCtx=soundsManager.ctx
        this.soundsManager=soundsManager

        const img=new Image()
        img.src=default_sprite_src
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        this.default_sprite=new Sprite(default_sprite_src,default_sprite_src);
        img.addEventListener("load",()=>{
            this.default_sprite.texture=loadTexture(img)
        })
    }
    async load_source(id:string,src:string,scale:number=1,volume:number=1):Promise<Source|undefined>{
        if(src.endsWith(".svg")||src.endsWith(".png")){
            return await this.load_sprite(id,src,scale)
        }else if(src.endsWith(".mp3")){
            return await this.load_audio(id,{src:src,volume:volume})
        }else if(src.endsWith(".src")){
            await this.load_folder(src,scale)
        }

        return undefined
    }
    get_sprite(id:string):Sprite{
        if(!this.sources[id]){
            return this.default_sprite
        }
        return this.sources[id] as Sprite
    }
    load_sprite(id:string,src:string,scale=1):Promise<Sprite>{
        return new Promise<Sprite>((resolve, _reject) => {
            if(this.sources[id])resolve(this.sources[id] as Sprite)
            if(src.endsWith(".svg")){
                fetch(src).then((r)=>r.text()).then(txt=>{
                    const svg=this.domp.parseFromString(txt, "image/svg+xml");
                    // deno-lint-ignore ban-ts-comment
                    //@ts-expect-error
                    resolve(this.load_svg(id,svg.querySelector("svg"),src,scale))
                })
            }else{
                const img=new Image()
                this.sources[id]=new Sprite(src,src);
                img.addEventListener("load",()=>{
                    const sp=this.sources[id] as Sprite
                    sp.texture=loadTexture(img)
                    resolve(sp)
                });
                img.src=src
            }
        })
    }
    private load_svg(id:string,svg:SVGAElement,svg_path:string="",scale:number=1):Promise<Sprite>{
        return new Promise<Sprite>((resolve, _reject) => {
            if(this.sources[id]){
                resolve(this.sources[id] as Sprite)
            }
            svg.setAttribute("currentScale", scale.toString())
            const img=new Image()
            img.onload=()=>{
                const size=v2.new(img.naturalWidth*2,img.naturalHeight*2)
                this.canvas.width=size.x
                this.canvas.height=size.y
                this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height)
                this.ctx.save()
                this.ctx.scale(scale, scale)
                this.ctx.drawImage(img, 0, 0,size.x,size.y)
                this.ctx.restore()
                const src=this.canvas.toDataURL()
                const imgr=new Image()
                this.sources[id]=new Sprite(src,svg_path);
                imgr.addEventListener("load",()=>{
                    const sp=this.sources[id] as Sprite
                    sp.texture=loadTexture(imgr)
                    resolve(sp)
                });
                imgr.src=src
            }
            img.src=getSvgUrl(this.dome.serializeToString(svg))
        })
    }
    get_audio(id:string):Sound{
        return this.sources[id] as Sound
    }
    load_audio(id:string,def:SoundDef):Promise<Sound|undefined>{
        return new Promise<Sound|undefined>((resolve, reject) => {
            if (this.sources[id] != undefined) {
                resolve(this.sources[id] as Sound)
            }
    
            const xhr = new XMLHttpRequest();
            xhr.open("GET", def.src);
            xhr.responseType = "arraybuffer";
            const onfailure = function onfailure(_event:ProgressEvent<XMLHttpRequestEventTarget>) {
                reject(`Failed loading sound file: ${id}`)
            };
            xhr.addEventListener("load", (event) => {
                const arrayBuffer = xhr.response;
                if (!arrayBuffer) {
                    onfailure(event);
                    return;
                }
                this.audioCtx.decodeAudioData(arrayBuffer, (audioBuffer) => {
                    (this.sources[id] as Sound)={buffer:audioBuffer,src:def.src,volume:def.volume??1,resourceType:SourceType.Sound}
                    resolve(this.sources[id] as Sound)
                }, () => {
                    reject(`Failed decoding sound: ${id}`);
                    resolve(undefined)
                });
            });
            xhr.addEventListener("abort", onfailure);
            xhr.addEventListener("error", onfailure);
            xhr.addEventListener("timeout", onfailure);
            xhr.send();
            resolve(this.sources[id] as Sound)
        })
    }
    get_animation(id:string):Animation{
        return this.sources[id] as Animation
    }
    async load_animation(id:string,path:string):Promise<Animation>{
        const json=await(await fetch(path)).json()
        let anim!:Animation
        for(const k of Object.keys(json["keys"])){
            anim={resourceType:SourceType.Animation,keys:{}}
            anim.keys[k]=[]
            for(const f of json.keys){
                anim.keys[k].push({ease:ease[f.ease as (keyof typeof ease)],delay:f.delay,value:f.value,dest:f.dest})
            }
        }
        this.sources[id]=anim
        return this.sources[id] as Animation
    }
    unload(id:string){
        if(this.sources[id]){
            switch(this.sources[id].resourceType){
                case SourceType.Sprite:
                    (this.sources[id] as Sprite).free();
                    break
                default:
                    break
            }
            delete this.sources[id]
        }
    }
    async load_folder(folder:string,scale:number=1){
        const foundeds:Record<string,string|SpriteDef> = {};
        try {
            const response = await fetch(`${folder}`);
            if (!response.ok) throw new Error(`Erro ao buscar a pasta: ${folder}`);

            const files = await response.json() as {files:Record<string,string|SpriteDef>,dir:string}

            console.log("Loading: ",folder+",",'dir:',files.dir)

            for (const file of Object.keys(files.files)) {
                foundeds[file]=files.dir+"/"+files.files[file]
            }
        } catch (error) {
            console.error(`Cant Load The Folder ${folder}: ${error.message}`);
        }
        for(const f of Object.keys(foundeds)){
            if(typeof foundeds[f]==="string"){
                this.unload(f)
                await this.load_source(f,`${foundeds[f]}`,scale)
            }else{
                if((foundeds[f] as SpriteDef).variations){
                    const sca=((foundeds[f] as SpriteDef).scale??1)*scale
                    for(let i=0;i<(foundeds[f] as SpriteDef).variations!;i++){
                        const extF=(foundeds[f] as SpriteDef).path.split(".")
                        const ext=extF[extF.length-1]
                        extF.length--
                        const name=extF.join(".")
                        const id=f+`_${i+1}`
                        this.unload(id)
                        await this.load_source(id,`${name}_${i+1}.${ext}`,sca)
                    }
                }else{
                    this.unload(f)
                    await this.load_source(f,`${(foundeds[f] as SpriteDef).path}`,((foundeds[f] as SpriteDef).scale??1)*scale)
                }
            }
        }
    }
}
export enum AudioState{
    finished,
    playing,
    succeeded,
    failed,
    inited,
    interrupt
}