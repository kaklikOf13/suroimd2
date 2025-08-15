import { CircleHitbox2D, Hitbox2D, HitboxType2D, NullVec2, RectHitbox2D, Vec2, matrix4, v2 } from "common/scripts/engine/mod.ts"
import { Model2D, SourceType, type Frame } from "./resources.ts";
import { Numeric } from "common/scripts/engine/utils.ts";
import { type Camera2D } from "./container.ts";
export interface Transform2D{
    position:Vec2
    scale:Vec2
    rotation:number
}
export interface Color {
    r: number; // Red
    g: number; // Green
    b: number; // Blue
    a: number; // Alpha
}
export const ColorM={
    /**
     * Create The Color RGBA, limit=`(0 To 255)`
     * @param r Red
     * @param g Green
     * @param b Blue
     * @param a Alpha
     * @returns A New Color
     */
    rgba(r: number, g: number, b: number, a: number = 255): Color {
        return { r: r / 255, g: g / 255, b: b / 255, a: a / 255 };
    },
    hex(hex:string):Color{
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
    },
    number(color:number):Color{
        const r = (color >> 16) & 0xFF
        const g = (color >> 8) & 0xFF
        const b = color & 0xFF
        return { r:r/255, g:g/255, b:b/255, a: 1 }
    },
    rgba2hex(color:Color):string{
        const red = (color.r*255).toString(16).padStart(2, '0')
        const green = (color.g*255).toString(16).padStart(2, '0')
        const blue = (color.b*255).toString(16).padStart(2, '0')

        const alpha = (color.a*255).toString(16).padStart(2, '0')

        if (alpha === 'ff') {
            return `#${red}${green}${blue}`
        }

        return `#${red}${green}${blue}${alpha}`
    },
    number2hex(color:number):string{
        return `0x${color.toString(16).padStart(6, '0')}`
    },
    hex2number(color: string): number {
        return parseInt(color.replace(/^0x/, ''), 16)
    },
    default:{
        black:{
            r:0,
            g:0,
            b:0,
            a:1
        },
        white:{
            r:1,
            g:1,
            b:1,
            a:1
        },
        transparent:{
            r:0,
            g:0,
            b:0,
            a:0,
        },
        red:{
            r:1,
            g:0,
            b:0,
            a:1
        },
        green:{
            r:0,
            g:1,
            b:0,
            a:1
        },
        blue:{
            r:0,
            g:0,
            b:1,
            a:1
        },
        yellow:{
            r:1,
            g:1,
            b:0,
            a:1
        }
    },
    lerp(a:Color, b: Color,i:number): Color {
        return { r: Numeric.lerp(a.r,b.r,i), g: Numeric.lerp(a.g,b.g,i), b: Numeric.lerp(a.b,b.b,i), a: Numeric.lerp(a.a,b.a,i) };
    },
    clone(a:Color): Color {
        return { r: a.r,g: a.g,b: a.b,a: a.a};
    },
}
export type RGBAT={r: number, g: number, b: number, a?: number}
export abstract class Renderer {
    canvas: HTMLCanvasElement
    readonly meter_size: number
    background: Color = ColorM.default.white;
    constructor(canvas: HTMLCanvasElement, meter_size: number = 100) {
        this.canvas = canvas
        this.meter_size = meter_size
    }
    // deno-lint-ignore no-explicit-any
    abstract draw_rect2D(rect: RectHitbox2D,material:Material2D<any>,offset?:Vec2): void
    abstract draw_circle2D(circle: CircleHitbox2D, material: Material2D,offset?:Vec2, precision?: number): void
    abstract draw_image2D(image: Frame,position: Vec2,model:Float32Array,tint?:Color): void
    abstract draw_hitbox2D(hitbox: Hitbox2D, mat: Material2D,offset?:Vec2): void

    abstract clear(): void

    abstract resize(camera:Camera2D,depth?:number):void

    fullCanvas(camera:Camera2D,depth:number=500){
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
    gl_Position = u_ProjectionMatrix*vec4(a_Position+u_Translation.xy,0.0,1.0);
    vTextureCoord = a_TexCoord;
}`;

const texFragmentShaderSource = `
precision mediump float;

varying highp vec2 vTextureCoord;
uniform sampler2D u_Texture;
uniform vec4 u_Tint;

void main(void) {
    vec2 flippedCoord = vec2(vTextureCoord.x, 1.0 - vTextureCoord.y);
    gl_FragColor = texture2D(u_Texture, flippedCoord)*u_Tint;
}`;
// deno-lint-ignore no-explicit-any
export class Material2D<MaterialArgs=any>{
    factory:Material2DFactory<MaterialArgs>
    args!:MaterialArgs
    resourceType=SourceType.Material
    constructor(factory:Material2DFactory<MaterialArgs>){
        this.factory=factory
    }
}
export type Mat2DFunc<MatArgs>=(factory:Material2DFactory<MatArgs>,args:MatArgs,m:Model2D,trans:Transform2D,mode:number)=>void
// deno-lint-ignore no-explicit-any
export class Material2DFactory<MaterialArgs=any>{
    on_execute:Mat2DFunc<MaterialArgs>
    gl:WebGLRenderingContext
    program:WebGLProgram
    constructor(gl:WebGLRenderingContext,program:WebGLProgram,on_execute:Mat2DFunc<MaterialArgs>){
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
export class WebglRenderer extends Renderer {
    readonly gl: WebGLRenderingContext;
    projectionMatrix!: Float32Array;
    readonly tex_program:WebGLProgram
    readonly factorys2D:{
        simple:Material2DFactory<Color>
        texture:Material2DFactory<Frame>
    }
    readonly factorys2D_consts:Record<string,Record<string,number|WebGLUniformLocation>>={}
    constructor(canvas: HTMLCanvasElement, meter_size: number = 100, background: Color = ColorM.default.white) {
        super(canvas, meter_size);
        const gl = this.canvas.getContext("webgl", { antialias: true });
        this.background = background;
        this.gl = gl!;

        this.factorys2D={
            simple:new Material2DFactory<Color>(gl!,this.createProgram(
`
attribute vec2 a_Position;
uniform mat4 u_ProjectionMatrix;
uniform vec2 u_Translation;
uniform vec2 u_Scale;
void main() {
    gl_Position = u_ProjectionMatrix * vec4((a_Position*u_Scale)+u_Translation, 0.0, 1.0);
}`,
`
#ifdef GL_ES
precision mediump float;
#endif

uniform vec4 u_Color;

void main() {
    gl_FragColor = u_Color;
}
`
            ),(factory:Material2DFactory<Color>,args:Color,model:Model2D,trans:Transform2D,mode:number)=>{
                const vertexBuffer = this.gl.createBuffer();
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, model.vertices, this.gl.STATIC_DRAW);
                this.gl.useProgram(factory.program);

                const positionAttributeLocation = this.factorys2D_consts["simple"]["position"] as number;
                this.gl.enableVertexAttribArray(positionAttributeLocation);
                this.gl.vertexAttribPointer(positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

                this.gl.uniform4f(this.factorys2D_consts["simple"]["color"], args.r, args.g, args.b, args.a);

                this.gl.uniform2f(this.factorys2D_consts["simple"]["translation"], trans.position.x, trans.position.y);
                this.gl.uniform2f(this.factorys2D_consts["simple"]["scale"], trans.scale.x, trans.scale.y);

                this.gl.uniformMatrix4fv(this.factorys2D_consts["simple"]["proj"], false, this.projectionMatrix);

                this.gl.drawArrays(mode, 0, model.vertices.length / 2);
            }),
            "texture":new Material2DFactory<Frame>(gl!,this.createProgram(
`
attribute vec2 a_Position;
attribute vec2 a_TexCoord;
    
uniform mat4 u_ProjectionMatrix;
uniform vec2 u_Translation;

varying highp vec2 vTextureCoord;

void main(void) {
    gl_Position = u_ProjectionMatrix*vec4(a_Position+u_Translation.xy,0.0,1.0);
    vTextureCoord = a_TexCoord;
}`,
`
precision mediump float;

varying highp vec2 vTextureCoord;
uniform sampler2D u_Texture;
uniform vec4 u_Tint;

void main(void) {
    vec2 flippedCoord = vec2(vTextureCoord.x, 1.0 - vTextureCoord.y);
    gl_FragColor = texture2D(u_Texture, flippedCoord)*u_Tint;
}`
            ),(factory:Material2DFactory<Frame>,args:Frame,model:Model2D,trans:Transform2D,mode:number)=>{
                const vertexBuffer = this.gl.createBuffer();
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, model.vertices, this.gl.STATIC_DRAW);

                const textureCoordBuffer = this.gl.createBuffer()
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoordBuffer)
                this.gl.bufferData(this.gl.ARRAY_BUFFER, model.tex_coords, this.gl.STATIC_DRAW)
                this.gl.useProgram(factory.program);

                const positionAttributeLocation = this.factorys2D_consts["texture"]["position"] as number;
                this.gl.enableVertexAttribArray(positionAttributeLocation);
                this.gl.vertexAttribPointer(positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoordBuffer)
                this.gl.enableVertexAttribArray(this.factorys2D_consts["texture"]["coord"] as number);
                this.gl.vertexAttribPointer(this.factorys2D_consts["texture"]["coord"] as number, 2, this.gl.FLOAT, false, 0, 0)

                this.gl.uniform2f(this.factorys2D_consts["texture"]["translation"], trans.position.x, trans.position.y);
                this.gl.uniform2f(this.factorys2D_consts["texture"]["scale"], trans.scale.x, trans.scale.y);

                this.gl.uniformMatrix4fv(this.factorys2D_consts["texture"]["proj"], false, this.projectionMatrix);

                this.gl.activeTexture(this.gl.TEXTURE0);
                this.gl.bindTexture(this.gl.TEXTURE_2D, args.texture);
                this.gl.uniform1i(this.factorys2D_consts["texture"]["texture"] as WebGLUniformLocation, 0)

                this.gl.drawArrays(mode, 0, model.vertices.length / 2);


            }),
        }
        let factory=this.factorys2D.simple
        this.factorys2D_consts["simple"]={
            "position":this.gl.getAttribLocation(factory.program, "a_Position"),
            "color":this.gl.getUniformLocation(factory.program, "u_Color")!,
            "translation":this.gl.getUniformLocation(factory.program, "u_Translation")!,
            "scale":this.gl.getUniformLocation(factory.program, "u_Scale")!,
            "proj":this.gl.getUniformLocation(factory.program, "u_ProjectionMatrix")!,
        }
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        factory=this.factorys2D.texture
        this.factorys2D_consts["texture"]={
            "position":this.gl.getAttribLocation(factory.program, "a_Position"),
            "translation":this.gl.getUniformLocation(factory.program, "u_Translation")!,
            "scale":this.gl.getUniformLocation(factory.program, "u_Scale")!,
            "proj":this.gl.getUniformLocation(factory.program, "u_ProjectionMatrix")!,
            "coord":this.gl.getAttribLocation(factory.program, "a_TexCoord"),
            "texture":this.gl.getUniformLocation(factory.program, "u_Texture")!,
        }

        //Tex Program
        const tex_program = gl!.createProgram();
        gl!.attachShader(tex_program!, this.createShader(texVertexShaderSource, gl!.VERTEX_SHADER))
        gl!.attachShader(tex_program!, this.createShader(texFragmentShaderSource, gl!.FRAGMENT_SHADER))
        this.tex_program = tex_program!
        gl!.linkProgram(this.tex_program)
        
        this.factorys2D_consts["texture_ADV"]={
            "position":this.gl.getAttribLocation(this.tex_program, "a_Position"),
            "coord":this.gl.getAttribLocation(this.tex_program, "a_TexCoord"),
            "color":this.gl.getUniformLocation(this.tex_program, "u_Color")!,
            "translation":this.gl.getUniformLocation(this.tex_program, "u_Translation")!,
            "scale":this.gl.getUniformLocation(this.tex_program, "u_Scale")!,
            "proj":this.gl.getUniformLocation(this.tex_program, "u_ProjectionMatrix")!,
            "texture":this.gl.getUniformLocation(this.tex_program, "u_Texture")!,
            "tint":this.gl.getUniformLocation(this.tex_program, "u_Tint")!,
        }

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
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        this.resize({zoom:1},500)
    }
    resize(camera:Camera2D,depth:number=500){
        const scaleX = this.canvas.width / (this.meter_size*camera.zoom)
        const scaleY = this.canvas.height / (this.meter_size*camera.zoom)
        this.projectionMatrix = new Float32Array(matrix4.projection(v2.new(scaleX,scaleY),depth))
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
    draw_vertices(model:Model2D,material:Material2D,trans:Transform2D,mode:number=this.gl.TRIANGLES){
        material.factory.on_execute(material.factory,material.args,model,trans,mode)
    }
    draw_rect2D(rect: RectHitbox2D, material: Material2D,offset:Vec2=NullVec2) {
        const x1 = 0
        const y1 = 0
        const x2 = rect.max.x-rect.min.x
        const y2 = rect.max.x-rect.min.x

        this.draw_vertices({vertices:new Float32Array([
            x1, y1,
            x2, y1,
            x1, y2,
            x1, y2,
            x2, y1,
            x2, y2
        ]),tex_coords:new Float32Array([])}, material,{position:v2.sub(rect.position,offset),scale:v2.new(1,1),rotation:0});
    }

    draw_circle2D(circle: CircleHitbox2D, material: Material2D,offset:Vec2=NullVec2, precision: number = 50): void {
        const centerX = 0
        const centerY = 0
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
        this.draw_vertices({vertices:new Float32Array(vertices),tex_coords:new Float32Array()}, material,{position:v2.sub(circle.position,offset),scale:v2.new(1,1),rotation:0},this.gl.TRIANGLE_FAN);
    }

    draw_hitbox2D(hitbox: Hitbox2D, mat: Material2D,offset:Vec2=NullVec2): void {
        switch (hitbox.type) {
            case HitboxType2D.circle:
                this.draw_circle2D(hitbox, mat,offset)
                break;
            case HitboxType2D.rect:
                this.draw_rect2D(hitbox, mat,offset)
                break;
            default:
                return;
        }
    }

    draw_image2D(image: Frame,position: Vec2,model:Float32Array,tint:Color=ColorM.default.white): void {
        const program=this.tex_program

        const vertexBuffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(model), this.gl.STATIC_DRAW)

        const textureCoordBuffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoordBuffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, image.texture_coordinates, this.gl.STATIC_DRAW)

        this.gl.useProgram(program);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer)
        this.gl.enableVertexAttribArray(this.factorys2D_consts["texture_ADV"]["position"] as number)
        this.gl.vertexAttribPointer(this.factorys2D_consts["texture_ADV"]["position"] as number, 2, this.gl.FLOAT, false, 0, 0)

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoordBuffer)
        this.gl.enableVertexAttribArray(this.factorys2D_consts["texture_ADV"]["coord"] as number);
        this.gl.vertexAttribPointer(this.factorys2D_consts["texture_ADV"]["coord"] as number, 2, this.gl.FLOAT, false, 0, 0)

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, image.texture);
        this.gl.uniform1i(this.factorys2D_consts["texture_ADV"]["texture_ADV"] as WebGLUniformLocation, 0)

        this.gl.uniformMatrix4fv(this.factorys2D_consts["texture_ADV"]["proj"], false, this.projectionMatrix);

        this.gl.uniform2f(this.factorys2D_consts["texture_ADV"]["translation"],position.x,position.y)

        this.gl.uniform4f(this.factorys2D_consts["texture_ADV"]["tint"],tint.r,tint.g,tint.b,tint.a)

        this.gl.drawArrays(this.gl.TRIANGLES, 0, model.length / 2)
    }

    clear() {
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0, 0, 0, 1);
        this.canvas.style.backgroundColor=`rgb(${0},${0},${0})`
        this.gl.clear(this.gl.COLOR_BUFFER_BIT |this.gl.DEPTH_BUFFER_BIT);
        
        this.gl.enable(this.gl.DEPTH_TEST)
        this.gl.depthMask(true)
        this.gl.depthFunc(this.gl.LEQUAL)
        this.gl.enable(this.gl.BLEND)
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)
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
    const ratio = self.devicePixelRatio || 1;

    elem.width  = self.innerWidth  * ratio;
    elem.height = self.innerHeight * ratio;

    elem.style.width  = `${self.innerWidth}px`;
    elem.style.height = `${self.innerHeight}px`;

    const ctx = elem.getContext("2d");
    if (ctx) {
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
}
