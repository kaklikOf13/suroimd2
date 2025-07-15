import { EaseFunction, ease, v2 } from "common/scripts/engine/mod.ts";
import { Material2D } from "./renderer.ts";
import { type SoundManager } from "./sounds.ts";
interface FrameData {
    x: number
    y: number
    w: number
    h: number
    file?:string
}
export interface SpritesheetJSON {
    meta: { image: string,scale:number,size:{w:number,h:number} }
    frames: Record<string, FrameData>
}
export interface SoundDef{
    volume:number
    src:string
}
export class Sprite{
    source:HTMLImageElement
    texture!:WebGLTexture
    src:string
    path:string
    readonly resourceType:SourceType.Sprite=SourceType.Sprite
    gl:WebGLRenderingContext
    constructor(source:HTMLImageElement,gl:WebGLRenderingContext,src:string,path:string){
        this.source=source
        this.path=path
        this.src=src
        this.gl=gl
    }
    free(){
        this.gl.deleteTexture(this.texture)
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
export type Source=Sprite|Animation|Sound|Material2D
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
    gl:WebGLRenderingContext
    audioCtx:AudioContext
    soundsManager:SoundManager
    default_sprite:Sprite
    constructor(gl:WebGLRenderingContext,soundsManager:SoundManager){ 
        this.sources={}
        this.canvas=document.createElement("canvas")
        this.ctx=this.canvas.getContext("2d")!
        this.gl=gl
        this.audioCtx=soundsManager.ctx
        this.soundsManager=soundsManager

        const img=new Image()
        img.src=default_sprite_src
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        this.default_sprite=new Sprite(img,null,default_sprite_src,default_sprite_src);
        this.default_sprite.source.addEventListener("load",()=>{
            this.default_sprite.texture=loadTexture(this.gl,this.default_sprite.source)!
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
    render_text(text:string, fontSize = 32,color="white",font:string="Arial"):Promise<Sprite>{
        return new Promise<Sprite>((resolve, _reject) => {
            this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height)
            this.ctx.save()
            this.ctx.font = `${fontSize}px ${font}`
            const textMetrics = this.ctx.measureText(text)
            this.canvas.width = textMetrics.width
            this.canvas.height = fontSize * 1.5


            this.ctx.font=`${fontSize}px ${font}`
            this.ctx.font = `${fontSize}px ${font}`
            this.ctx.fillStyle = color
            this.ctx.fillText(text, 0, fontSize)

            const src=this.canvas.toDataURL()

            this.ctx.restore()
            const ret=new Sprite(new Image(),this.gl,src,"");
            ret.source.addEventListener("load",()=>{
                const sp=ret as Sprite
                sp.texture=loadTexture(this.gl,sp.source)!
                resolve(ret)
            });
            ret.source.src=src
        })
    }
    get_sprite(id:string):Sprite{
        if(!this.sources[id]){
            return this.default_sprite
        }
        return this.sources[id] as Sprite
    }
    async load_spritesheet(idPrefix: string, json: SpritesheetJSON, imagePathOverride?: string) {
        const imagePath = imagePathOverride ?? json.meta.image;
        const image = await this.load_image(imagePath);

        const sheetCanvas = document.createElement("canvas");
        const sheetCtx = sheetCanvas.getContext("2d")!;
        sheetCanvas.width = image.naturalWidth;
        sheetCanvas.height = image.naturalHeight;
        sheetCtx.drawImage(image, 0, 0);

        for (const [id, frame] of Object.entries(json.frames)) {
            const frameCanvas = document.createElement("canvas");
            const frameCtx = frameCanvas.getContext("2d")!;
            frameCanvas.width = frame.w/json.meta.scale;
            frameCanvas.height = frame.h/json.meta.scale;

            frameCtx.drawImage(
                sheetCanvas,
                frame.x, frame.y, frame.w, frame.h,
                0, 0, frame.w/json.meta.scale, frame.h/json.meta.scale
            );

            const spriteImage = new Image();
            const src = frameCanvas.toDataURL();
            spriteImage.src = src;

            const sprite = new Sprite(spriteImage, this.gl, src, frame.file??imagePath);
            spriteImage.onload = () => {
                sprite.texture = loadTexture(this.gl, spriteImage)!;
            };

            this.sources[`${idPrefix}${id}`] = sprite;
        }
    }
    private load_image(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
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
                this.sources[id]=new Sprite(new Image(),this.gl,src,src);
                (this.sources[id] as Sprite).source.addEventListener("load",()=>{
                    const sp=this.sources[id] as Sprite
                    sp.texture=loadTexture(this.gl,sp.source)!
                    resolve(sp)
                });
                (this.sources[id] as Sprite).source.src=src;
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
                this.sources[id]=new Sprite(new Image(),this.gl,src,svg_path);
                (this.sources[id] as Sprite).source.addEventListener("load",()=>{
                    const sp=this.sources[id] as Sprite
                    sp.texture=loadTexture(this.gl,sp.source)!
                    resolve(sp)
                });
                (this.sources[id] as Sprite).source.src=src
            }
            img.src=getSvgUrl(this.dome.serializeToString(svg))
        })
    }
    load_material2D(id:string,mat:Material2D){
        this.sources[id]=mat
    }
    get_material2D(id:string):Material2D{
        return this.sources[id] as Material2D
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