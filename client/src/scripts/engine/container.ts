import { v2, Vec2 } from "common/scripts/engine/geometry.ts";
import { Color, ColorM, Renderer, WebglRenderer } from "./renderer.ts";
import { type ResourcesManager, type Frame, ImageModel2D } from "./resources.ts";
import { KeyFrameSpriteDef } from "common/scripts/engine/definitions.ts";
import { Numeric } from "common/scripts/engine/mod.ts";

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
export class Grid2D extends Container2DObject{
    object_type:string="sprite2d"

    color:Color=ColorM.rgba(0,0,0,90)
    grid_size:number=16
    width:number=0.034
    constructor(){
        super()
    }
    override draw(renderer: Renderer): void {
        const mat=(renderer as WebglRenderer).factorys2D.grid.create_material({
            color:this.color,
            gridSize:this.grid_size,
            width:this.width,
        });
        (renderer as WebglRenderer)._draw_vertices([
          -1000, -1000, 
          1000, -1000,
          -1000,  1000,
          -1000,  1000,
          1000, -1000,
          1000,  1000
        ],mat,{position:v2.neg(this._real_position),scale:this._real_scale,rotation:this._real_rotation,zIndex:0})
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
                this.frame=resources.get_sprite(this.frames[this.current_frame].image)
            }
        }
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