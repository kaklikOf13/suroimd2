import { SmoothShape2D, v2, Vec2 } from "common/scripts/engine/geometry.ts";
import { Color, ColorM, Renderer, WebglRenderer,Material2D, GLMaterial2D, GL2D_LightMatArgs } from "./renderer.ts";
import { type ResourcesManager, type Frame, DefaultTexCoords } from "./resources.ts";
import { AKeyFrame, FrameDef, FrameTransform, KeyFrameSpriteDef } from "common/scripts/engine/definitions.ts";
import { Numeric } from "common/scripts/engine/mod.ts";
import { Hitbox2D, HitboxType2D } from "common/scripts/engine/hitbox.ts";
import { ClientGame2D } from "./game.ts";
import { type Tween } from "./utils.ts";
import { ImageModel2D, Matrix, matrix4, Model2D, model2d } from "common/scripts/engine/models.ts";
export interface CamA{
    matrix:Matrix
    position:Vec2
    size:Vec2
    meter_size:number
    center_pos:boolean
}
export abstract class Container2DObject {
    abstract object_type: string;

    parent?: Container2D;
    zIndex: number = 0;

    id_on_parent:number=0

    position: Vec2 = v2.new(0, 0);
    scale: Vec2 = v2.new(1, 1);
    rotation: number = 0;
    tint: Color = ColorM.default.white;

    _real_position: Vec2 = v2.new(0, 0);
    _real_scale: Vec2 = v2.new(1, 1);
    _real_rotation: number = 0;
    _real_tint: Color = ColorM.default.white;

    visible:boolean=true

    destroyed:boolean=false
    destroy(){
        this.destroyed=true
        if(this.parent)this.parent.update_deletions()
    }

    update(_dt:number,_resources:ResourcesManager): void {
        if (this.parent) {
            this._real_position = v2.add(
                v2.rotate_RadAngle(
                    v2.mult(this.parent._real_scale, this.position),
                    this.parent._real_rotation
                ),
                this.parent._real_position
            );

            this._real_scale = v2.mult(this.parent._real_scale, this.scale);
            this._real_rotation = this.parent._real_rotation + this.rotation;

            this._real_tint = {
                r: this.parent._real_tint.r * this.tint.r,
                g: this.parent._real_tint.g * this.tint.g,
                b: this.parent._real_tint.b * this.tint.b,
                a: this.parent._real_tint.a * this.tint.a
            };
        } else {
            this._real_position = this.position;
            this._real_scale = this.scale;
            this._real_rotation = this.rotation;
            this._real_tint = this.tint;
        }
    }

    abstract draw(cam:CamA,renderer: Renderer): void;
}
export function triangulateConvex(
    polygon: Vec2[],
    texSize: number = 32
): Model2D {
    const vertices: number[] = [];
    const tex_coords: number[] = [];

    for (let i = 1; i < polygon.length - 1; i++) {
        const tri = [polygon[0], polygon[i], polygon[i + 1]];

        for (const v of tri) {
            vertices.push(v.x, v.y);

            const u = v.x / texSize;
            const vv = v.y / texSize;
            tex_coords.push(u, vv);
        }
    }

    return {
        vertices: new Float32Array(vertices),
        tex_coords: new Float32Array(tex_coords)
    };
}

function isInside(p: Vec2, edgeStart: Vec2, edgeEnd: Vec2): boolean {
    return (edgeEnd.x - edgeStart.x) * (p.y - edgeStart.y) -
           (edgeEnd.y - edgeStart.y) * (p.x - edgeStart.x) >= 0;
}

function computeIntersection(p1: Vec2, p2: Vec2, e1: Vec2, e2: Vec2): Vec2 {
    const A1 = p2.y - p1.y;
    const B1 = p1.x - p2.x;
    const C1 = A1 * p1.x + B1 * p1.y;

    const A2 = e2.y - e1.y;
    const B2 = e1.x - e2.x;
    const C2 = A2 * e1.x + B2 * e1.y;

    const denom = A1 * B2 - A2 * B1;
    if (denom === 0) return p1; // paralelos

    const x = (B2 * C1 - B1 * C2) / denom;
    const y = (A1 * C2 - A2 * C1) / denom;
    return v2.new(x, y);
}

function sutherlandHodgman(subject: Vec2[], clip: Vec2[]): Vec2[] {
    let output = subject.slice();

    for (let i = 0; i < clip.length; i++) {
        const input = output;
        output = [];

        const A = clip[i];
        const B = clip[(i + 1) % clip.length];

        for (let j = 0; j < input.length; j++) {
            const P = input[j];
            const Q = input[(j + 1) % input.length];

            const Pinside = isInside(P, A, B);
            const Qinside = isInside(Q, A, B);

            if (Pinside && Qinside) {
                output.push(Q);
            } else if (Pinside && !Qinside) {
                output.push(computeIntersection(P, Q, A, B));
            } else if (!Pinside && Qinside) {
                output.push(computeIntersection(P, Q, A, B));
                output.push(Q);
            }
        }
    }

    return output;
}
/*function cut(pathA: number[], pathB: number[]): number[] {
    const polyA: Vec2[] = [];
    for (let i = 0; i < pathA.length; i += 2)
        polyA.push(v2.new(pathA[i], pathA[i + 1]));

    const polyB: Vec2[] = [];
    for (let i = 0; i < pathB.length; i += 2)
        polyB.push(v2.new(pathB[i], pathB[i + 1]));

    const result = sutherlandHodgman(polyA, polyB);

    if (result.length < 3) return [];

    const triangles: number[] = [];
    for (let i = 1; i < result.length - 1; i++) {
        triangles.push(
            result[0].x, result[0].y,
            result[i].x, result[i].y,
            result[i + 1].x, result[i + 1].y
        );
    }

    return triangles;
}*/
type Graphics2DCommand =
  | { type: 'fillMaterial'; mat:Material2D }
  | { type: 'fillColor'; color:Color }
  | { type: 'fill' }
  | { type: 'path'; path:Model2D }
  | { type: 'model'; model:Model2D }

export class Graphics2D extends Container2DObject {
    object_type = "graphics2d";

    current_path:Vec2[]=[]
    current_position:Vec2=v2.new(0,0)

    repeat_size:number=1

    command: Graphics2DCommand[] = [];
    paths:number[][]=[]

    beginPath(): this {
        this.current_path=[];   
        return this;
    }
    lineTo(x:number,y:number):this{
        this.current_path.push(v2.new(x,y))
        this.current_position=v2.new(x,y)
        return this
    }
    smooth_shape(subdivisions=8) {
        this.current_path=SmoothShape2D(this.current_path,subdivisions)
    }

    endPath():this{
        this.command.push({type:"path",path:triangulateConvex(this.current_path,this.repeat_size)})
        this.current_path=[]
        return this
    }
    fill():this{
        this.command.push({type:"fill"})
        return this
    }
    fill_material(mat:Material2D):this{
        this.command.push({type:"fillMaterial",mat:mat})
        return this
    }
    fill_color(color:Color):this{
        this.command.push({type:"fillColor",color})
        return this
    }
    clear(){
        this.command.length=0
    }
    drawGrid(begin:Vec2,size:Vec2,space:number,width:number){
        const minx=begin.x*space
        const miny=begin.y*space
        const maxx = (begin.x + size.x)*space;
        const maxy = (begin.y + size.y)*space;

        for (let x = minx; x <= maxx; x += space) {
            const p1 = v2.new(x, miny);
            const p2 = v2.new(x, maxy);
            this.drawLine(p1,p2,width)
        }

        for (let y = miny; y <= maxy; y += space) {
            const p1 = v2.new(minx, y);
            const p2 = v2.new(maxx, y);
            this.drawLine(p1,p2,width)
        }
    }
    drawLine(a:Vec2,b:Vec2,width:number){
        this.command.push({type:"model",model:model2d.line(a,b,width)})
    }
    set_hitbox(hb:Hitbox2D){
        switch(hb.type){
            case HitboxType2D.rect:
                this.lineTo(hb.min.x,hb.min.y)
                this.lineTo(hb.max.x,hb.min.y)
                this.lineTo(hb.max.x,hb.max.y)
                this.lineTo(hb.min.x,hb.max.y)
                break
            case HitboxType2D.null:
            case HitboxType2D.circle:
            case HitboxType2D.group:
                break
            case HitboxType2D.polygon:
                for(const p of hb.points){
                    this.lineTo(p.x+hb.position.x,p.y+hb.position.y)
                }
                break
        }
    }

    override draw(cam:CamA,renderer: Renderer): void {
        const gl = renderer as WebglRenderer;

        let currentMat: Material2D=gl.factorys2D.simple.create({color:{r:0,g:0,b:0,a:1}});
        let currentModel:Model2D

        for (const cmd of this.command) {
            switch (cmd.type) {
                case "fillMaterial":
                    currentMat=cmd.mat
                    break
                case "fillColor":
                    currentMat=gl.factorys2D.simple.create({color:cmd.color})
                    break
                case "fill":
                    gl.draw(currentModel!,currentMat,cam.matrix,this._real_position,this._real_scale)
                    break
                case "model": {
                    gl.draw(cmd.model,currentMat,cam.matrix,this._real_position,v2.new(1,1))
                    break;
                }
                case "path":
                    currentModel=cmd.path
                    break
            }
        }
    }
}
export class Sprite2D extends Container2DObject{
    object_type:string="sprite2d"
    _frame?:Frame
    hotspot:Vec2=v2.new(0,0)
    size?:Vec2

    private _old_scale?:Vec2
    private _old_hotspot?:Vec2
    private _old_rotation?:number
    private _old_size?:Vec2

    _real_size:Vec2=v2.new(0,0)

    get frame():Frame|undefined{
        return this._frame
    }
    set frame(f:Frame|undefined){
        this._frame=f
        this.update_model()
    }

    frames?:KeyFrameSpriteDef[]
    current_delay:number=0
    current_frame:number=0

    old_ms=1

    cam?:CamA

    update_model(){
        if(!this.frame||!this.cam)return
        this._real_size=this.size??this.frame.frame_size??v2.new(this.frame.source.width,this.frame.source.height)
        this.model=ImageModel2D(this._real_scale,this._real_rotation,this.hotspot,this._real_size,100)
        this._old_hotspot=v2.duplicate(this.hotspot)
        this._old_scale=v2.duplicate(this._real_scale)
        this._old_size=v2.duplicate(this._real_size)
        this._old_rotation=this._real_rotation
        this.old_ms=this.cam.meter_size
    }

    model:Float32Array

    constructor(){
        super()
        this.model=ImageModel2D(this.scale,this.rotation,this.hotspot,v2.new(0,0),100)
    }
    override update(dt:number,resources:ResourcesManager){
        super.update(dt,resources)
        if(this.frames){
            if(this.current_delay<this.frames[this.current_frame].delay){
                this.current_delay+=dt
            }else{
                this.current_delay=0
                this.current_frame=Numeric.loop(this.current_frame+1,0,this.frames.length)
                this.set_frame(this.frames[this.current_frame],resources)
            }
        }
    }
    
    set_frame(frame:FrameDef,resources:ResourcesManager){
        if(frame.scale)this.scale=v2.new(frame.scale,frame.scale)
        if(frame.hotspot)this.hotspot=v2.duplicate(frame.hotspot)
        if(frame.rotation)this.rotation=frame.rotation
        if(frame.visible)this.visible=frame.visible
        if(frame.zIndex)this.zIndex=frame.zIndex
        if(frame.position)this.position=v2.duplicate(frame.position)
        if(frame.image)this.frame=resources.get_sprite(frame.image)
    }
    
    transform_frame(frame:FrameTransform){
        if(frame.scale)this.scale=v2.new(frame.scale,frame.scale)
        if(frame.hotspot)this.hotspot=v2.duplicate(frame.hotspot)
        if(frame.rotation)this.rotation=frame.rotation
        if(frame.visible)this.visible=frame.visible
        if(frame.zIndex)this.zIndex=frame.zIndex
        if(frame.position)this.position=v2.duplicate(frame.position)
        this.update_model()
    }
    override draw(cam:CamA,renderer: Renderer): void {
        this.cam=cam
        if(
            (!this._old_rotation||!this._old_scale||!this._old_size||!this._old_hotspot)||
            (this.old_ms!==cam.meter_size)||
            (!v2.is(this._old_hotspot,this.hotspot)||this._real_rotation!==this._old_rotation||v2.is(this._real_scale,this._old_scale)||v2.is(this._real_size,this._old_size))
        )this.update_model()
        if(this.frame)renderer.draw_image2D(this.frame,this._real_position,this.model,cam.matrix,this._real_tint)
    }
}
export class Container2D extends Container2DObject{
    object_type:string="container2d"
    children:Container2DObject[]=[]

    update_deletions(){
        this.children = this.children.filter(c => !c.destroyed);
    }
    override update(dt:number,resources:ResourcesManager){
        super.update(dt,resources);
        for (const c of this.children) c.update(dt,resources);
    }
    updateZIndex(){
        this.children.sort((a, b) => a.zIndex - b.zIndex || a.id_on_parent - b.id_on_parent);
    }
    draw(cam:CamA,renderer:Renderer,objects?:Container2DObject[]):void{
        if(!objects)objects=this.children
        for(const c of objects){
            if(c.visible)c.draw(cam,renderer)
        }
    }
    add_child(c:Container2DObject){
        c.id_on_parent=this.children.length+1
        c.parent=this
        this.children.push(c)
    }
    constructor(){
        super()
    }
}
export class AnimatedContainer2D extends Container2D{
    objects=new Map<string,Sprite2D>()

    current_animations:{
        current_kf:number
        current_delay:number
        keyframes:AKeyFrame[]
        on_complete?:()=>void
        tweens:Tween<any>[]
    }[]=[]
    game:ClientGame2D
    constructor(game:ClientGame2D){
        super()
        this.game=game
    }
    stop_all_animations(){
      for(const a of this.current_animations){
        for(const t of a.tweens){
            t.kill()
        }
      }
        this.current_animations=[]
    }
    play_animation(anim:AKeyFrame[],on_complete?:()=>void){
        const a={
            current_kf:-1,
            current_delay:0,
            keyframes:anim,
            on_complete:on_complete,
            tweens:[]
        }
        this.current_animations.push(a)
    }
    override update(dt: number, resources: ResourcesManager): void {
      super.update(dt,resources)
      for(let i=0;i<this.current_animations.length;i++){
        const a=this.current_animations[i]
        a.current_delay-=dt
        if(a.current_delay<=0){
            a.current_kf++
            if(a.current_kf>=a.keyframes.length){
                if(a.on_complete)a.on_complete()
                this.current_animations.splice(i,1)
                i--
                continue
            }else{
                a.tweens.length=0
                const nd=a.keyframes[a.current_kf].time
                a.current_delay=nd
                for(const action of a.keyframes[a.current_kf].actions){
                    switch(action.type){
                        case "sprite":
                            this.get_spr(action.fuser).set_frame(action,this.game.resources)
                            this.updateZIndex()
                            break
                        case "tween":{
                            const fuser=this.get_spr(action.fuser)
                            if(nd>0){
                                if(action.to.position){
                                    this.current_animations[i].tweens.push(this.game.addTween({
                                        duration:nd,
                                        target:fuser.position,
                                        ease:action.ease,
                                        to:action.to.position
                                    }))
                                }
                                if(action.to.hotspot){
                                    this.current_animations[i].tweens.push(this.game.addTween({
                                        duration:nd,
                                        target:fuser.hotspot,
                                        ease:action.ease,
                                        to:action.to.hotspot
                                    }))
                                }
                                if(action.to.rotation){
                                    this.current_animations[i].tweens.push(this.game.addTween({
                                        duration:nd,
                                        target:fuser,
                                        ease:action.ease,
                                        to:{rotation:action.to.rotation}
                                    }))
                                }
                            }else{
                                fuser.transform_frame(action.to)
                            }
                            break
                        }
                    }
                }
            }
        }
      }
    }
    add_animated_sprite(id:string,def?:FrameTransform):Sprite2D{
        const spr=new Sprite2D()
        this.objects.set(id,spr)
        if(def)spr.transform_frame(def)
        this.add_child(spr)
        return spr
    }
    get_spr(id:string):Sprite2D{
        return this.objects.get(id)!
    }
}

export type Light2D = {
    mat: GLMaterial2D<GL2D_LightMatArgs>
    pos: Vec2
    model: Model2D
    destroyed: boolean
}

export class Lights2D extends Container2DObject {
    override object_type = "lights";

    private renderer!: WebglRenderer;
    private lightFBO!: WebGLFramebuffer;
    private lightTexture!: WebGLTexture;
    private lights: Light2D[] = [];
    downscale = 1.0;
    ambientColor: Color = { r: 1, g: 1, b: 1, a: 1 };

    quality:number=2 // 0 = None, 1=Just Global Light, 2 All Lights

    ambient_light?:GLMaterial2D<GL2D_LightMatArgs>
    get ambient() {
        return 1-this.ambientColor.a
    }
    set ambient(v: number) {
        this.ambientColor.a=1-v
    }

    private initFramebuffer(w: number, h: number) {
        const gl = this.renderer.gl;
        if (this.lightTexture) gl.deleteTexture(this.lightTexture);
        if (this.lightFBO) gl.deleteFramebuffer(this.lightFBO);

        this.lightTexture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, this.lightTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, Math.floor(w), Math.floor(h), 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        this.lightFBO = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightFBO);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.lightTexture, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    /*addRadialLight(pos: Vec2, radius: number, intensity = 1.0, color: Color = { r: 1, g: 1, b: 1, a: 1 }) {
        const mat = this.renderer.factorys2D.light.create({ color, radius, intensity});
        const inst: LightInstance = { mat, pos: v2.duplicate(pos), radius, model:model2d.rect(v2.new(-radius,-radius),v2.new(radius,radius)), destroyed: false };
        this.lights.push(inst);
        return inst;
    }*/
    addLight(pos: Vec2, model:Model2D, color: Color = { r: 1, g: 1, b: 1, a: 1 }) {
        const mat = this.renderer.factorys2D.light.create({ color});
        const inst: Light2D = { mat, pos: v2.duplicate(pos), model, destroyed: false };
        this.lights.push(inst);
        return inst;
    }

    private _lastW:number=0
    private _lastH:number=0
    render(renderer: WebglRenderer, camera: Camera2D) {
        this.renderer = renderer;
        const gl = renderer.gl;
        if(this.quality==0){
            if (this.lightTexture) gl.deleteTexture(this.lightTexture);
            if (this.lightFBO) gl.deleteFramebuffer(this.lightFBO);
            return
        }

        const w = Math.max(1, camera.width*camera.meter_size*this.downscale);
        const h = Math.max(1, camera.height*camera.meter_size*this.downscale);

        if (!this.lightFBO || !this.lightTexture || this._lastW !== w || this._lastH !== h) {
            this.initFramebuffer(w, h);
            this._lastW = w;
            this._lastH = h;
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightFBO);

        gl.viewport(0, 0, w, h);
        gl.disable(gl.BLEND);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);

        if(!this.ambient_light)this.ambient_light=renderer.factorys2D.light.create({color:this.ambientColor})
        this.ambient_light!.color=this.ambientColor
        renderer.draw(this.screenModel,this.ambient_light,camera.projectionMatrix,camera.visual_position,v2.new(1,1))
        if(this.quality>=2){
            for (let i = 0; i < this.lights.length; i++) {
                const L = this.lights[i];
                if (L.destroyed) { this.lights.splice(i, 1); i--; continue; }
                renderer.draw(L.model, L.mat,camera.projectionMatrix, L.pos, v2.new(1,1));
            }
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        this.updateScreenModel(v2.new(camera.width,camera.height), camera.meter_size)
        gl.viewport(0, 0, renderer.canvas.width, renderer.canvas.height)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        //this.logLightTextureBase64()
    }

    screenModel:Model2D=model2d.rect()
    private updateScreenModel(pixelSize: Vec2, meterSize: number) {
        const s=v2.scale(pixelSize,meterSize)
        this.screenModel=model2d.rect(v2.scale(s,0),v2.scale(s,1))
    }
    logLightTextureBase64() {
        if (!this.lightTexture || !this.lightFBO) return;
        const gl = this.renderer.gl;

        const w = gl.drawingBufferWidth;
        const h = gl.drawingBufferHeight;

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightFBO);

        const pixels = new Uint8Array(w * h * 4);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        const imgData = ctx.createImageData(w, h);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const srcIndex = ((h - y - 1) * w + x) * 4;
                const dstIndex = (y * w + x) * 4;
                imgData.data[dstIndex + 0] = pixels[srcIndex + 0];
                imgData.data[dstIndex + 1] = pixels[srcIndex + 1];
                imgData.data[dstIndex + 2] = pixels[srcIndex + 2];
                imgData.data[dstIndex + 3] = pixels[srcIndex + 3];
            }
        }

        ctx.putImageData(imgData, 0, 0);

        const dataURL = canvas.toDataURL("image/png")
        console.log("Light Texture Base64:", dataURL)
    }

    draw(cam:CamA,renderer: WebglRenderer) {
        if (!this.lightTexture||this.quality===0) return;

        const mat = renderer.factorys2D.texture.create({
            texture: this.lightTexture,
            tint: { r: 1, g: 1, b: 1, a: 1 }
        });
        const gl=renderer.gl
        renderer.gl.blendFunc(gl.DST_COLOR, gl.ZERO);
        renderer.draw(this.screenModel,mat,cam.matrix,cam.position,v2.new(0.01,0.01))
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    }
}
export class SubCanvas2D extends Container2DObject {
    override object_type = "sub_canvas";

    private renderer!: WebglRenderer;
    private FBO!: WebGLFramebuffer;
    private Texture!: WebGLTexture;

    container:Container2D=new Container2D()

    downscale = 1.0
    width:number
    height:number
    add_child(c:Container2DObject){
        this.container.add_child(c)
    }

    size?:Vec2

    _zoom:number=1
    constructor(width:number,height:number){
        super()
        this.width=width
        this.height=height
    }
    size_matrix:Matrix=matrix4.identity()
    resize(){
        const scale=this.camera.meter_size*this._zoom

        const scaleX = this.width / (this.camera.meter_size*this._zoom)
        const scaleY = this.height / (this.camera.meter_size*this._zoom)

        this.size_matrix = matrix4.projection(v2.new(scaleX,scaleY),500)

        this.camera.size=v2.new(this.width/scale,this.height/scale)  
    }

    private initFramebuffer(w: number, h: number) {
        const gl = this.renderer.gl;
        this.resize()
        if (this.Texture) gl.deleteTexture(this.Texture);
        if (this.FBO) gl.deleteFramebuffer(this.FBO);

        this.Texture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, this.Texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, Math.floor(w), Math.floor(h), 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        this.FBO = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.FBO);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.Texture, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    private _lastW:number=0
    private _lastH:number=0

    camera:CamA={
        matrix:matrix4.identity(),
        meter_size:5,
        position:this.position,
        size:v2.new(5,5),
        center_pos:false
    }
    render(renderer: WebglRenderer, camera: Camera2D,objects?:Container2DObject[]) {
        this.renderer = renderer;
        const gl = renderer.gl;

        const w = Math.max(1, this.width*this.downscale);
        const h = Math.max(1, this.height*this.downscale);

        if (!this.FBO || !this.Texture || this._lastW !== w || this._lastH !== h) {
            this.initFramebuffer(w, h);
            this._lastW = w;
            this._lastH = h;
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.FBO);

        gl.viewport(0, 0, w, h);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        if(this.camera.center_pos){
            const halfViewSize = v2.new(this.camera.size.x / 2, this.camera.size.y / 2)
            const cameraPos = v2.sub(this.camera.position, halfViewSize)
            this.camera.matrix=matrix4.mult(this.size_matrix,matrix4.translation_2d(v2.neg(cameraPos)))
        }else{
            this.camera.matrix=matrix4.mult(this.size_matrix,matrix4.translation_2d(v2.neg(this.camera.position)))
        }
        this.container.draw(this.camera,renderer,objects)

        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        this.updateScreenModel(v2.new(w,h), camera.meter_size)
        gl.viewport(0, 0, renderer.canvas.width, renderer.canvas.height)
    }

    screenModel:Model2D=model2d.rect()
    hotspot:Vec2=v2.new(0.5,0.5)
    override update(dt: number, resources: ResourcesManager): void {
        super.update(dt,resources)
        this.container.update(dt,resources)
    }
    private updateScreenModel(pixelSize: Vec2, meterSize: number) {
        this.screenModel={
            tex_coords:new Float32Array(DefaultTexCoords),
            vertices:ImageModel2D(this._real_scale,this._real_rotation,this.hotspot,this.size??pixelSize,meterSize)
        }
    }
    toBase64(resources:ResourcesManager):string{
        if (!this.Texture || !this.FBO) return "";
        const gl = this.renderer.gl;

        const w = Math.floor(this.width*this.downscale)
        const h = Math.floor(this.height*this.downscale)

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.FBO)

        const pixels = new Uint8Array(w * h * 4)
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels)

        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        const canvas=resources.canvas
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!
        const imgData = ctx.createImageData(w, h)
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const srcIndex = ((h - y - 1) * w + x) * 4
                const dstIndex = (y * w + x) * 4
                imgData.data[dstIndex + 0] = pixels[srcIndex + 0]
                imgData.data[dstIndex + 1] = pixels[srcIndex + 1]
                imgData.data[dstIndex + 2] = pixels[srcIndex + 2]
                imgData.data[dstIndex + 3] = pixels[srcIndex + 3]
            }
        }

        ctx.putImageData(imgData, 0, 0);

        const dataURL = canvas.toDataURL("image/png")
        return dataURL
    }

    override draw(cam:CamA,renderer: WebglRenderer) {
        if (!this.Texture) return;

        const mat = renderer.factorys2D.texture.create({
            texture: this.Texture,
            tint: { r: 1, g: 1, b: 1, a: 1 }
        });
        renderer.draw(this.screenModel,mat,cam.matrix,this._real_position,v2.new(1,-1))
    }
}
export class Minimap2D extends SubCanvas2D{
    type="minimap"

    image_division:number

    min:Vec2
    max:Vec2
    
    fill_objects:Container2DObject[]=[]

    grid:Record<number,Record<number,Container2DObject[]>>={}

    override add_child(c: Container2DObject,fill:boolean=true): void {
        if(fill){
            this.fill_objects.push(c)
        }else{
            const gp=v2.floor(v2.scale(c._real_position,this.image_division))
            const min=v2.sub(gp,v2.new(1,1))
            const max=v2.add(gp,v2.new(1,1))
            for(let y=min.y;y<max.y;y++){
                if(!this.grid[y])this.grid[y]={}
                for(let x=min.x;x<max.x;x++){
                    if(!this.grid[y][x])this.grid[y][x]=[]
                    this.grid[y][x].push(c)
                }
            }
        }
        super.add_child(c)
    }

    get_mm_grid_objects(min:Vec2,max:Vec2):Container2DObject[]{
        const ret:Container2DObject[]=[]
        for(let y=min.y;y<max.y;y++){
            if(!this.grid[y])continue
            for(let x=min.x;x<max.x;x++){
                if(!this.grid[y][x])continue
                ret.push(...this.grid[y][x])
            }
        }
        return ret
    }
    get_grid_objects(pos:Vec2):Container2DObject[]{
        if(!this.grid[pos.y])return []
        if(!this.grid[pos.y][pos.x])return []
        return this.grid[pos.y][pos.x]
    }

    constructor(image_division=20,min:Vec2=v2.new(0,0),max:Vec2=v2.new(100,100)){
        super(250,250)
        this.min=min
        this.max=max
        this.image_division=image_division
    }
    render_full(resources:ResourcesManager,renderer: WebglRenderer, camera: Camera2D,min?:Vec2,max?:Vec2): string[][] {
        const ret:string[][]=[]
        if(!min)min=v2.ceil(v2.dscale(this.min,this.image_division))
        if(!max)max=v2.ceil(v2.dscale(this.max,this.image_division))
        this.width=this.image_division*this.camera.meter_size
        this.height=this.image_division*this.camera.meter_size
        for(let y=min.y;y<max.y;y++){
            const ya:string[]=[]
            for(let x=min.x;x<max.x;x++){
                this.camera.position=v2.scale(v2.new(x,y),this.image_division)
                super.render(renderer,camera,[...this.get_grid_objects(v2.new(x,y)),...this.fill_objects])
                ya.push(this.toBase64(resources))
            }
            ret.push(ya)
        }
        return ret
    }
}
export class Camera2D{
    renderer:Renderer
    container:Container2D=new Container2D()
    private _zoom = 1;
    projectionMatrix!: Matrix;
    SubMatrix!: Matrix;
    get zoom(): number { return this._zoom; }
    set zoom(zoom: number) {
        this._zoom = zoom;
        this.resize();
    }

    width = 1;
    height = 1;
    meter_size: number = 100

    position = v2.new(0, 0)
    visual_position=v2.new(0,0)

    center_pos:boolean=true

    constructor(renderer:Renderer){
        this.renderer=renderer
        this.zoom=1
    }

    addObject(...objects: Container2DObject[]): void {
        for(const o of objects){
            this.container.add_child(o);
        }
        this.container.updateZIndex();
    }

    resize(): void {
        const scale=this.meter_size*this._zoom

        const scaleX = this.renderer.canvas.width / (this.meter_size*this.zoom)
        const scaleY = this.renderer.canvas.height / (this.meter_size*this.zoom)
        this.SubMatrix = matrix4.projection(v2.new(scaleX,scaleY),500)

        this.width = this.renderer.canvas.width/scale;
        this.height = this.renderer.canvas.height/scale;
    }

    update(dt:number,resources:ResourcesManager): void {
        if(this.center_pos){
            const halfViewSize = v2.new(this.width / 2, this.height / 2);
            const cameraPos = v2.sub(this.position, halfViewSize);

            this.visual_position=cameraPos
            this.projectionMatrix=this.SubMatrix

            this.projectionMatrix = matrix4.mult(this.SubMatrix,matrix4.translation_2d(v2.neg(cameraPos)))
        }else{
            this.visual_position=this.position
            this.projectionMatrix=this.SubMatrix

            this.projectionMatrix = matrix4.mult(this.SubMatrix,matrix4.translation_2d(v2.neg(this.position)))
        }
        this.container.update(dt,resources);
    }

    draw(renderer:Renderer){
        this.container.draw({
            matrix:this.projectionMatrix,
            position:this.visual_position,
            meter_size:this.meter_size,
            size:v2.new(this.width,this.height),
            center_pos:this.center_pos
        },renderer)
    }
}