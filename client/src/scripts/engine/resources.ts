import { EaseFunction, ease } from "common/scripts/engine/mod.ts";

export interface SoundDef{
    volume:number
    src:string
}
export class Sprite{
    source:HTMLImageElement
    texture:WebGLTexture
    readonly resourceType:SourceType.Sprite=SourceType.Sprite
    constructor(source:HTMLImageElement,texture:WebGLTexture){
        this.source=source
        this.texture=texture
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
}
export type Source=Sprite|Animation|Sound
function getSvgUrl(svg:string) {
    return  URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
}

function loadTexture(gl:WebGLRenderingContext, source:HTMLImageElement) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source
    );
    //gl.generateMipmap(gl.TEXTURE_2D);
  
    return texture;
}

export class ResourcesManager{
    sources:Record<string,Source>
    canvas:HTMLCanvasElement
    ctx:CanvasRenderingContext2D
    audioCtx:AudioContext
    domp=new DOMParser()
    dome=new XMLSerializer()
    gl:WebGLRenderingContext
    constructor(gl:WebGLRenderingContext){ 
        this.sources={}
        this.canvas=document.createElement("canvas")
        this.ctx=this.canvas.getContext("2d")!
        this.audioCtx=new AudioContext()
        this.gl=gl
    }
    get_sprite(id:string):Sprite{
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
                    resolve(this.load_svg(id,svg.querySelector("svg"),scale))
                })
            }else{
                this.sources[id]=new Sprite(new Image(),this.gl.createTexture()!);
                (this.sources[id] as Sprite).source.onload=()=>{
                    const sp=this.sources[id] as Sprite
                    sp.texture=loadTexture(this.gl,sp.source)!
                    resolve(sp)
                }
                (this.sources[id] as Sprite).source.src=src;
            }
        })
    }
    load_svg(id:string,svg:SVGAElement,scale:number=1):Promise<Sprite>{
        return new Promise<Sprite>((resolve, _reject) => {
            if(this.sources[id]){
                resolve(this.sources[id] as Sprite)
            }
            svg.setAttribute("currentScale", scale.toString())
            const img=new Image()
            img.onload=()=>{
                this.canvas.width=img.naturalWidth
                this.canvas.height=img.naturalHeight
                this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height)
                this.ctx.drawImage(img, 0, 0)
                this.sources[id]=new Sprite(new Image(),this.gl.createTexture()!);
                (this.sources[id] as Sprite).source.onload=()=>{
                    const sp=this.sources[id] as Sprite
                    sp.texture=loadTexture(this.gl,sp.source)!
                    resolve(sp)
                }
                (this.sources[id] as Sprite).source.src=this.canvas.toDataURL()
            }
            img.src=getSvgUrl(this.dome.serializeToString(svg))
        })
    }
    get_audio(id:string):Sound{
        return this.sources[id] as Sound
    }
    load_audio(id:string,def:SoundDef):Promise<SoundDef>{
        return new Promise<SoundDef>((resolve, reject) => {
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
                    (this.sources[id] as Sound)={buffer:audioBuffer,...def,resourceType:SourceType.Sound};
                    resolve(this.sources[id] as Sound)
                }, () => {
                    reject(`Failed decoding sound: ${id}`);
                });
            });
            xhr.addEventListener("abort", onfailure);
            xhr.addEventListener("error", onfailure);
            xhr.addEventListener("timeout", onfailure);
            xhr.send();
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
    delete_source(id:string){
        delete this.sources[id]
    }
    unload(id:string){
        delete this.sources[id]
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