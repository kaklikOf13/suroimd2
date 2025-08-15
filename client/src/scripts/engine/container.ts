import { SmoothShape2D, v2, Vec2 } from "common/scripts/engine/geometry.ts";
import { Color, ColorM, Renderer, WebglRenderer,Material2D } from "./renderer.ts";
import { type ResourcesManager, type Frame, ImageModel2D, LineModel2D, Model2D, } from "./resources.ts";
import { AKeyFrame, FrameDef, FrameTransform, KeyFrameSpriteDef } from "common/scripts/engine/definitions.ts";
import { Numeric } from "common/scripts/engine/mod.ts";
import { Hitbox2D, HitboxType2D } from "common/scripts/engine/hitbox.ts";
import { ClientGame2D } from "./game.ts";
import { type Tween } from "./utils.ts";

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

    abstract draw(renderer: Renderer): void;
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

    private command: Graphics2DCommand[] = [];
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
        this.command.push({type:"model",model:LineModel2D(a,b,width)})
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

    override draw(renderer: Renderer): void {
        const gl = renderer as WebglRenderer;

        let currentMat: Material2D=gl.factorys2D.simple.create_material({r:0,g:0,b:0,a:1});
        let currentModel:Model2D

        for (const cmd of this.command) {
            switch (cmd.type) {
                case "fillMaterial":
                    currentMat=cmd.mat
                    break
                case "fillColor":
                    currentMat=gl.factorys2D.simple.create_material(cmd.color)
                    break
                case "fill":
                    gl.draw_vertices(currentModel!,currentMat,{
                        position:this._real_position,
                        rotation:this._real_rotation,
                        scale:this._real_scale
                    })
                    break
                case "model": {
                    gl.draw_vertices(cmd.model,currentMat,{
                        position:this._real_position,
                        scale:v2.new(1,1),
                        rotation:0
                    })
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

    update_model(){
        if(!this.frame||!this.renderer)return
        this._real_size=this.size??this.frame.frame_size??v2.new(this.frame.source.width,this.frame.source.height)

        this.model=ImageModel2D(this._real_scale,this._real_rotation,this.hotspot,this._real_size,this.renderer.meter_size)
        this._old_hotspot=v2.duplicate(this.hotspot)
        this._old_scale=v2.duplicate(this._real_scale)
        this._old_size=v2.duplicate(this._real_size)
        this._old_rotation=this._real_rotation
    }

    model:Float32Array

    renderer?:Renderer

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
    override draw(renderer: Renderer): void {
        this.renderer=renderer
        if(
            (!this._old_rotation||!this._old_scale||!this._old_size||!this._old_hotspot)||
            (!v2.is(this._old_hotspot,this.hotspot)||this._real_rotation!==this._old_rotation||v2.is(this._real_scale,this._old_scale)||v2.is(this._real_size,this._old_size))
        )this.update_model()
        if(this.frame)renderer.draw_image2D(this.frame,this._real_position,this.model,this._real_tint)
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
    draw(renderer:Renderer):void{
        for(const c of this.children){
            if(c.visible)c.draw(renderer)
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
export class Camera2D{
    renderer:Renderer
    container:Container2D=new Container2D()
    private _zoom = 1;
    get zoom(): number { return this._zoom; }
    set zoom(zoom: number) {
        this._zoom = zoom;
        this.resize();
    }

    width = 1;
    height = 1;

    position = v2.new(0, 0);
    visual_position=v2.new(0,0)

    constructor(renderer:Renderer){
        this.renderer=renderer
        this.zoom=1
    }

    addObject(...objects: Container2DObject[]): void {
        for(const o of objects){
            this.container.add_child(o);
        }
    }

    resize(): void {
        const scale=this.renderer.meter_size*this._zoom

        this.width = this.renderer.canvas.width/scale;
        this.height = this.renderer.canvas.height/scale;
    }

    update(dt:number,resources:ResourcesManager): void {
        //const scale = this._zoom;
        const halfViewSize = v2.new(this.width / 2, this.height / 2);

        const cameraPos = v2.sub(this.position, halfViewSize);

        this.container.position = v2.neg(cameraPos);
        this.visual_position=cameraPos

        this.container.update(dt,resources);
        this.container.updateZIndex();
    }

}