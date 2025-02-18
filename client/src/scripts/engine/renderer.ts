import { Angle, CircleHitbox2D, Hitbox2D, HitboxType2D, NullVec2, RectHitbox2D, Vec2, matrix4, v2 } from "common/scripts/engine/mod.ts"
import { type Sprite } from "./resources.ts";
export interface Camera2D{
    position:Vec2
    zoom:number
}
export interface Transform2D{
    position:Vec2
    scale:Vec2
    rotation:number
    zIndex:number
}
export interface Color {
    r: number; // Red
    g: number; // Green
    b: number; // Blue
    a: number; // Alpha
}

export const RGBA = Object.freeze({
    /**
     * Create The Color RGBA, limit=`(0 To 255)`
     * @param r Red
     * @param g Green
     * @param b Blue
     * @param a Alpha
     * @returns A New Color
     */
    new(r: number, g: number, b: number, a: number = 255): Color {
        return { r: r / 255, g: g / 255, b: b / 255, a: a / 255 };
    },
    from(json:RGBAT): Color{
        return {r:json.r/255,g:json.g/255,b:json.b/255,a:(json.a??255)/255}
    }
})
export const HEXCOLOR=Object.freeze({
    new(hex:string):Color{
        let result:RegExpExecArray|null
        switch(hex.length){
            case 4:
                result = /^#?([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$/i.exec(hex)
                if(!result){
                    throw new Error("Invalid Hex")
                }
                return {
                    r:parseInt(result[1], 16)/15,
                    g:parseInt(result[2], 16)/15,
                    b:parseInt(result[3], 16)/15,
                    a:1
                }
            case 5:
                result = /^#?([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$/i.exec(hex)
                if(!result){
                    throw new Error("Invalid Hex")
                }
                return {
                    r:parseInt(hex[1], 16)/15,
                    g:parseInt(hex[2], 16)/15,
                    b:parseInt(hex[3], 16)/15,
                    a:parseInt(hex[4], 16)/15
                }
                case 7:
                    result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
                    if(!result){
                        throw new Error("Invalid Hex")
                    }
                    return {
                        r:parseInt(result[1], 16)/255,
                        g:parseInt(result[2], 16)/255,
                        b:parseInt(result[3], 16)/255,
                        a:1
                    }
                case 9:
                    result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
                    if(!result){
                        throw new Error("Invalid Hex")
                    }
                    return {
                        r:parseInt(result[1], 16)/255,
                        g:parseInt(result[2], 16)/255,
                        b:parseInt(result[3], 16)/255,
                        a:parseInt(result[4], 16)/255
                    }
            default:
                throw new Error("Invalid Hex")
        }
      }
})
export type RGBAT={r: number, g: number, b: number, a?: number}
export abstract class Renderer {
    canvas: HTMLCanvasElement
    readonly meter_size: number
    background: Color = RGBA.new(255, 255, 255);
    constructor(canvas: HTMLCanvasElement, meter_size: number = 100) {
        this.canvas = canvas
        this.meter_size = meter_size
    }
    // deno-lint-ignore no-explicit-any
    abstract draw_rect2D(rect: RectHitbox2D,material:Material2D<any>,offset?:Vec2,zIndex?:number): void
    abstract draw_circle2D(circle: CircleHitbox2D, material: Material2D,offset?:Vec2,zIndex?:number, precision?: number): void
    abstract draw_image2D(image: Sprite, position: Vec2, size: Vec2, angle: number, hotspot?: Vec2,zIndex?:number): void
    abstract draw_hitbox2D(hitbox: Hitbox2D, mat: Material2D,offset?:Vec2,zIndex?:number): void

    abstract clear(): void

    abstract resize(camera?:Camera2D,depth?:number):void

    fullCanvas(camera?:Camera2D,depth:number=500){
        fullCanvas(this.canvas)
        this.resize(camera,depth)
    }
}

const texVertexShaderSource = `
attribute vec2 a_Position;
attribute vec2 a_TexCoord;
    
uniform mat4 u_ProjectionMatrix;
uniform vec2 u_Translation;

varying highp vec2 vTextureCoord;

void main(void) {
    gl_Position = u_ProjectionMatrix*vec4(a_Position+u_Translation,0.1,1.0);
    vTextureCoord = a_TexCoord;
}`;

const texFragmentShaderSource = `
precision mediump float;

varying highp vec2 vTextureCoord;
uniform sampler2D u_Texture;

void main(void) {
    vec2 flippedCoord = vec2(vTextureCoord.x, 1.0 - vTextureCoord.y);
    gl_FragColor = texture2D(u_Texture, flippedCoord);
}`;
// deno-lint-ignore no-explicit-any
export class Material2D<MaterialArgs=any>{
    factory:Material2DFactory<MaterialArgs>
    args!:MaterialArgs
    constructor(factory:Material2DFactory<MaterialArgs>){
        this.factory=factory
    }
}
// deno-lint-ignore no-explicit-any
export class Material2DFactory<MaterialArgs=any>{
    on_execute:(factory:Material2DFactory<MaterialArgs>,args:MaterialArgs,vertex:number[],trans:Transform2D,mode:number)=>void
    gl:WebGLRenderingContext
    program:WebGLProgram
    constructor(gl:WebGLRenderingContext,program:WebGLProgram,on_execute:(factory:Material2DFactory<MaterialArgs>,args:MaterialArgs,vertex:number[],trans:Transform2D,mode:number)=>void){
        this.on_execute=on_execute
        this.gl=gl
        this.program=program
    }
    create_material(args:MaterialArgs):Material2D<MaterialArgs>{
        const ret=new Material2D(this)
        ret.args=args
        return ret
    }
}
function rotatePoint(x:number, y:number, angle:number) {
    const cosTheta = Math.cos(angle);
    const sinTheta = Math.sin(angle);
    return {
        x: cosTheta * x - sinTheta * y,
        y: sinTheta * x + cosTheta * y
    };
}
export interface GridMaterialArgs {
    color:Color
    width:number
    gridSize:number
}
export class WebglRenderer extends Renderer {
    readonly gl: WebGLRenderingContext;
    projectionMatrix!: Float32Array;
    readonly tex_program:WebGLProgram
    readonly factorys2D:{
        simple:Material2DFactory<Color>,
        grid:Material2DFactory<GridMaterialArgs>
    }
    cam2Dsize!:Vec2
    constructor(canvas: HTMLCanvasElement, meter_size: number = 100, background: Color = RGBA.new(255, 255, 255),depth:number=500) {
        super(canvas, meter_size);
        const gl = this.canvas.getContext("webgl");
        this.background = background;
        this.gl = gl!;

        this.factorys2D={
            simple:new Material2DFactory<Color>(gl!,this.createProgram(
`
attribute vec2 a_Position;
uniform mat4 u_ProjectionMatrix;

void main() {
    gl_Position = u_ProjectionMatrix * vec4(a_Position, 1.0, 1.0);
}`,
`
#ifdef GL_ES
precision highp float;
#endif
uniform vec4 u_Color;

void main() {
    gl_FragColor = u_Color;
}`
            ),(factory:Material2DFactory<Color>,args:Color,vertices:number[],_trans:Transform2D,mode:number)=>{
                const vertexBuffer = this.gl.createBuffer();
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
                this.gl.useProgram(factory.program);

                const positionAttributeLocation = this.gl.getAttribLocation(factory.program, "a_Position");
                this.gl.enableVertexAttribArray(positionAttributeLocation);
                this.gl.vertexAttribPointer(positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

                const colorUniformLocation = this.gl.getUniformLocation(factory.program, "u_Color");
                this.gl.uniform4f(colorUniformLocation, args.r, args.g, args.b, args.a);

                const projectionMatrixLocation = this.gl.getUniformLocation(factory.program, "u_ProjectionMatrix");
                this.gl.uniformMatrix4fv(projectionMatrixLocation, false, this.projectionMatrix);

                this.gl.drawArrays(mode, 0, vertices.length / 2);
            }),
            grid:new Material2DFactory<GridMaterialArgs>(this.gl,this.createProgram(`
attribute vec2 a_Position;
uniform mat4 u_ProjectionMatrix;
uniform vec3 u_Translation;
varying vec2 v_WorldPosition;

void main() {
    v_WorldPosition = a_Position+u_Translation.xy;
    gl_Position = u_ProjectionMatrix * vec4(a_Position,u_Translation.z, 1.0);
}`,`
precision mediump float;
varying vec2 v_WorldPosition;

uniform float u_GridSize;
uniform vec4 u_Color;
uniform float u_LineWidth;

void main() {
    vec2 grid = abs(mod(v_WorldPosition, u_GridSize) - (u_GridSize * 0.5));

    float line = 1.0-step(u_LineWidth, min(grid.x, grid.y));
    gl_FragColor = vec4(u_Color.rgb, line * u_Color.a);
}`),(factory:Material2DFactory<GridMaterialArgs>,args:GridMaterialArgs,vertices:number[],trans:Transform2D,mode:number)=>{
    const vertexBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW)
    this.gl.useProgram(factory.program)

    const positionAttributeLocation = this.gl.getAttribLocation(factory.program, "a_Position")
    this.gl.enableVertexAttribArray(positionAttributeLocation)
    this.gl.vertexAttribPointer(positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0)

    let uniform=this.gl.getUniformLocation(factory.program,"u_GridSize")
    this.gl.uniform1f(uniform,args.gridSize)

    uniform=this.gl.getUniformLocation(factory.program,"u_LineWidth")
    this.gl.uniform1f(uniform,args.width)

    uniform=this.gl.getUniformLocation(factory.program,"u_Translation")
    this.gl.uniform3f(uniform,trans.position.x,trans.position.y,trans.zIndex)

    uniform = this.gl.getUniformLocation(factory.program, "u_ProjectionMatrix")
    this.gl.uniformMatrix4fv(uniform, false, this.projectionMatrix)

    uniform = this.gl.getUniformLocation(factory.program, "u_Color");
    this.gl.uniform4f(uniform, args.color.r, args.color.g, args.color.b, args.color.a)

    this.gl.drawArrays(mode, 0, vertices.length / 2)
})
        }

        //Tex Program
        const tex_program = gl!.createProgram();
        gl!.attachShader(tex_program!, this.createShader(texVertexShaderSource, gl!.VERTEX_SHADER))
        gl!.attachShader(tex_program!, this.createShader(texFragmentShaderSource, gl!.FRAGMENT_SHADER))
        this.tex_program = tex_program!
        gl!.linkProgram(this.tex_program)

        document.body.addEventListener("pointerdown", e => {
            canvas.dispatchEvent(new PointerEvent("pointerdown", {
                pointerId: e.pointerId,
                button: e.button,
                clientX: e.clientX,
                clientY: e.clientY,
                screenY: e.screenY,
                screenX: e.screenX
            }));
        });
        document.body.addEventListener("mousemove", e => {
            canvas.dispatchEvent(new PointerEvent("mousemove", {
                button: e.button,
                clientX: e.clientX,
                clientY: e.clientY,
                screenY: e.screenY,
                screenX: e.screenX
            }));
        });

        

        this.resize(undefined,depth)
    }
    resize(camera?:Camera2D,depth:number=1000){
        const scaleX = this.canvas.width / this.meter_size
        const scaleY = this.canvas.height / this.meter_size
        let zoom=1
        if(camera){
            zoom=camera.zoom
        }
        this.cam2Dsize=v2.new(scaleX*zoom,scaleY*zoom)
        this.projectionMatrix = new Float32Array(matrix4.projection(v2.new(scaleX*zoom,scaleY*zoom),depth/this.meter_size))
    }
    createShader(src: string, type: number): WebGLShader {
        const shader = this.gl.createShader(type);
        if (shader) {
            this.gl.shaderSource(shader, src);
            this.gl.compileShader(shader);
            if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
                throw Error("" + this.gl.getShaderInfoLog(shader));
            }
            return shader;
        }
        throw Error("Can't create shader");
    }
    createProgram(vertex:string,frag:string):WebGLProgram{
        const p = this.gl.createProgram();
        this.gl.attachShader(p!, this.createShader(vertex, this.gl.VERTEX_SHADER))
        this.gl.attachShader(p!, this.createShader(frag, this.gl.FRAGMENT_SHADER))
        this.gl.linkProgram(p!)
        return p!
    }
    _draw_vertices(vertices:number[],material:Material2D,trans:Transform2D,mode:number=this.gl.TRIANGLES){
        material.factory.on_execute(material.factory,material.args,vertices,trans,mode)
    }

    draw_rect2D(rect: RectHitbox2D, material: Material2D,offset:Vec2=NullVec2,zIndex=0) {
        const x1 = rect.position.x-offset.x
        const y1 = rect.position.y-offset.y
        const x2 = (rect.position.x-offset.x) + rect.size.x
        const y2 = (rect.position.y-offset.y) + rect.size.y

        this._draw_vertices([
            x1, y1,
            x2, y1,
            x1, y2,
            x1, y2,
            x2, y1,
            x2, y2
        ], material,{position:NullVec2,scale:v2.new(1,1),rotation:0,zIndex});
    }

    draw_circle2D(circle: CircleHitbox2D, material: Material2D,offset:Vec2=NullVec2,zIndex:number=0, precision: number = 50): void {
        const centerX = circle.position.x-offset.x
        const centerY = circle.position.y-offset.y
        const radius = circle.radius

        const angleIncrement = (2 * Math.PI) / precision

        const vertices: number[] = []
        vertices.push(centerX, centerY);
        for (let i = 0; i <= precision; i++) {
            const angle = angleIncrement * i
            const x = centerX + radius * Math.cos(angle)
            const y = centerY + radius * Math.sin(angle)
            vertices.push(x, y)
        }
        this._draw_vertices(vertices, material,{position:NullVec2,scale:v2.new(1,1),rotation:0,zIndex},this.gl.TRIANGLE_FAN);
    }

    draw_hitbox2D(hitbox: Hitbox2D, mat: Material2D,offset:Vec2=NullVec2,zIndex:number): void {
        switch (hitbox.type) {
            case HitboxType2D.circle:
                this.draw_circle2D(hitbox, mat,offset,zIndex)
                break;
            case HitboxType2D.rect:
                this.draw_rect2D(hitbox, mat,offset,zIndex)
                break;
            default:
                return;
        }
    }

    draw_image2D(image: Sprite, position: Vec2, scale: Vec2, angle: number, hotspot: Vec2=v2.new(0,0)): void {
        const size=v2.new((image.source.width/this.meter_size)*scale.x,(image.source.height/this.meter_size)*scale.y)
        const x1 = -size.x*hotspot.x
        const y1 = -size.y*hotspot.y
        const x2 = size.x+x1
        const y2 = size.y+y1

        const verticesB = [
            { x: x1, y: y1 },
            { x: x2, y: y1 },
            { x: x1, y: y2 },
            { x: x2, y: y2 }
        ];
        const verticesR = verticesB.map(vertex => rotatePoint(vertex.x, vertex.y, Angle.deg2rad(angle)));

        const vertices=[
            verticesR[0].x, verticesR[0].y,
            verticesR[1].x, verticesR[1].y,
            verticesR[2].x, verticesR[2].y,
            
            verticesR[2].x, verticesR[2].y,
            verticesR[1].x, verticesR[1].y,
            verticesR[3].x, verticesR[3].y
        ]

        const program=this.tex_program

        const textureCoordinates: number[] = [
            0.0, 1.0,
            1.0, 1.0,
            0.0, 0.0,
            0.0, 0.0,
            1.0, 1.0,
            1.0, 0.0
        ]
    
        const vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

        const textureCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), this.gl.STATIC_DRAW);

        this.gl.useProgram(program);

        let locationA:number|null = this.gl.getAttribLocation(program, "a_Position");
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.enableVertexAttribArray(locationA);
        this.gl.vertexAttribPointer(locationA, 2, this.gl.FLOAT, false, 0, 0);

        locationA = this.gl.getAttribLocation(program, "a_TexCoord");
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoordBuffer);
        this.gl.enableVertexAttribArray(locationA);
        this.gl.vertexAttribPointer(locationA, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, image.texture);
        this.gl.uniform1i(this.gl.getUniformLocation(program, "u_Texture"), 0);

        let location = this.gl.getUniformLocation(program, "u_ProjectionMatrix");
        this.gl.uniformMatrix4fv(location, false, this.projectionMatrix);


        location = this.gl.getUniformLocation(program, "u_Translation");
        this.gl.uniform2f(location,position.x,position.y);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, vertices.length / 2);
    }

    clear() {
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0, 0, 0, 0);
        this.canvas.style.backgroundColor=`rgb(${this.background.r*255},${this.background.g*255},${this.background.b*255})`
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        //this.gl.enable(this.gl.DEPTH_TEST);

        this.gl.depthMask(true)
        //this.gl.enable(this.gl.CULL_FACE)
        //this.gl.cullFace(this.gl.BACK)
        //this.gl.depthFunc(this.gl.LEQUAL);
    }
}

export function createCanvas(size: Vec2, pixelated: boolean = true, center: boolean = true): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = size.x;
    canvas.height = size.y;
    if (pixelated) {
        canvas.style.imageRendering = "pixelated"
        canvas.style.imageRendering = "crisp-edges"
        canvas.style.imageRendering = "-moz-crisp-edges"
    }
    if (center) {
        canvas.style.position = "absolute"
        canvas.style.left = "0px"
        canvas.style.right = "0px"
        canvas.style.top = "0px"
        canvas.style.bottom = "0px"
        canvas.style.margin = "auto"
    }
    return canvas;
}

export function applyBorder(elem: HTMLElement) {
    elem.style.border = "1px solid #000";
}

export function applyShadow(elem: HTMLElement) {
    elem.style.boxShadow = "0px 4px 17px 0px rgba(0,0,0,0.19)";
    elem.style.webkitBoxShadow = "0px 4px 17px 0px rgba(0,0,0,0.19)";
}

export function fullCanvas(elem: HTMLCanvasElement) {
    elem.width=self.innerWidth;
    elem.height=self.innerHeight;
}
