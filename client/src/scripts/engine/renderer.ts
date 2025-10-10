import { Vec2, Vec3 } from "common/scripts/engine/mod.ts"
import { type Frame } from "./resources.ts";
import { Numeric } from "common/scripts/engine/utils.ts";
import { Matrix, Model2D, Model3D } from "common/scripts/engine/models.ts";
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
    hex(hex: string): Color {
        hex = hex.replace("#", "");
        if ([3, 4, 6, 8].indexOf(hex.length) === -1) throw new Error("Invalid Hex")

        const toFloat = (v: string) => parseInt(v.repeat(2 / v.length), 16) / 255

        const r = toFloat(hex[0])
        const g = toFloat(hex[1])
        const b = toFloat(hex[2])
        const a = hex.length > 3 ? toFloat(hex[3]) : 1

        return { r, g, b, a };
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
export type Material2D=GLMaterial2D
export type Material3D=GLMaterial3D
export abstract class Renderer {
    canvas: HTMLCanvasElement
    background: Color = ColorM.default.white;
    constructor(canvas: HTMLCanvasElement, meter_size: number = 100) {
        this.canvas = canvas
    }
    abstract draw_image2D(image: Frame,position: Vec2,model:Float32Array,matrix:Matrix,tint?:Color): void
    abstract draw(model:Model2D,material:Material2D,matrix:Matrix,position:Vec2,scale:Vec2):void
    abstract draw_3d(model:Model3D,material:Material3D,matrix:Matrix,position:Vec3,scale:Vec3):void

    abstract clear(): void

    fullCanvas(){
        fullCanvas(this.canvas)
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
export type GLMaterial2D<MaterialArgs=any>={
    factory:GLMaterial2DFactory<MaterialArgs>
    draw:(mat:GLMaterial2D<MaterialArgs>,matrix:Matrix,model:Model2D,position:Vec2,scale:Vec2)=>void
}&MaterialArgs
export interface GLMaterial2DFactory<MaterialArgs>{
    create:(arg:MaterialArgs)=>GLMaterial2D<Material2D>
    program:WebGLProgram
}
export type GLMaterial2DFactoryCall<MaterialArgs>={vertex:string,frag:string,create:(gl:WebglRenderer,fac:GLMaterial2DFactory<MaterialArgs>)=>(arg:MaterialArgs)=>GLMaterial2D<Material2D>}

export type GLMaterial3D<MaterialArgs=any>={
    factory:GLMaterial3DFactory<MaterialArgs>
    draw:(mat:GLMaterial3D<MaterialArgs>,matrix:Matrix,model:Model3D,position:Vec3,scale:Vec3)=>void
}&MaterialArgs
export interface GLMaterial3DFactory<MaterialArgs>{
    create:(arg:MaterialArgs)=>GLMaterial3D<Material3D>
    program:WebGLProgram
}
export type GLMaterial3DFactoryCall<MaterialArgs>={vertex:string,frag:string,create:(gl:WebglRenderer,fac:GLMaterial3DFactory<MaterialArgs>)=>(arg:MaterialArgs)=>GLMaterial3D<Material3D>}

export type GL2D_SimpleMatArgs={
    color:Color
}
export const GLF_Simple:GLMaterial2DFactoryCall<GL2D_SimpleMatArgs>={
    vertex:`
attribute vec2 a_Position;
uniform mat4 u_ProjectionMatrix;
uniform vec2 u_Translation;
uniform vec2 u_Scale;
void main() {
    gl_Position = u_ProjectionMatrix * vec4((a_Position*u_Scale)+u_Translation, 0.0, 1.0);
}`,
    frag:`
#ifdef GL_ES
precision mediump float;
#endif

uniform vec4 u_Color;

void main() {
    gl_FragColor = u_Color;
}`,
create(gl:WebglRenderer,fac:GLMaterial2DFactory<GL2D_SimpleMatArgs>){
    const aPositionLoc=gl.gl.getAttribLocation(fac.program, "a_Position")
    const uColorLoc=gl.gl.getUniformLocation(fac.program, "u_Color")!
    const uTranslationLoc=gl.gl.getUniformLocation(fac.program, "u_Translation")!
    const uScaleLoc=gl.gl.getUniformLocation(fac.program, "u_Scale")!
    const uProjectionMatrixLoc=gl.gl.getUniformLocation(fac.program, "u_ProjectionMatrix")!

    const vertexBuffer = gl.gl.createBuffer();
    const draw=(mat:GLMaterial2D<GL2D_SimpleMatArgs>,matrix:Matrix,model:Model2D,position:Vec2,scale:Vec2)=>{
        gl.gl.useProgram(fac.program)

        gl.gl.bindBuffer(gl.gl.ARRAY_BUFFER, vertexBuffer)
        gl.gl.bufferData(gl.gl.ARRAY_BUFFER, model.vertices, gl.gl.STATIC_DRAW)

        gl.gl.enableVertexAttribArray(aPositionLoc)
        gl.gl.vertexAttribPointer(aPositionLoc, 2, gl.gl.FLOAT, false, 0, 0)

        gl.gl.uniform4f(uColorLoc, mat.color.r, mat.color.g, mat.color.b, mat.color.a)
        gl.gl.uniform2f(uTranslationLoc, position.x, position.y)
        gl.gl.uniform2f(uScaleLoc, scale.x, scale.y)
        gl.gl.uniformMatrix4fv(uProjectionMatrixLoc, false, matrix)
        gl.gl.drawArrays(gl.gl.TRIANGLES, 0, model.vertices.length / 2)
    }
    return (arg:GL2D_SimpleMatArgs)=>{
        return {
            ...arg,
            factory:fac,
            draw:draw
        }
    }
}
}

export type GL3D_SimpleMatArgs={
    color:Color
}
export const GLF_Simple3:GLMaterial3DFactoryCall<GL3D_SimpleMatArgs>={
    vertex:`
attribute vec3 a_Position;
uniform mat4 u_ProjectionMatrix;
uniform vec3 u_Translation;
uniform vec3 u_Scale;
void main() {
    gl_Position = u_ProjectionMatrix * vec4((a_Position*u_Scale)+u_Translation, 1.0);
}`,
    frag:`
#ifdef GL_ES
precision mediump float;
#endif

uniform vec4 u_Color;

void main() {
    gl_FragColor = u_Color;
}`,
create(gl:WebglRenderer,fac:GLMaterial3DFactory<GL3D_SimpleMatArgs>){
    const aPositionLoc=gl.gl.getAttribLocation(fac.program, "a_Position")
    const uColorLoc=gl.gl.getUniformLocation(fac.program, "u_Color")!
    const uTranslationLoc=gl.gl.getUniformLocation(fac.program, "u_Translation")!
    const uScaleLoc=gl.gl.getUniformLocation(fac.program, "u_Scale")!
    const uProjectionMatrixLoc=gl.gl.getUniformLocation(fac.program, "u_ProjectionMatrix")!

    const vertexBuffer = gl.gl.createBuffer();
    
    const indexBuffer = gl.gl.createBuffer();
    const draw=(mat:GLMaterial3D<GL3D_SimpleMatArgs>,matrix:Matrix,model:Model3D,position:Vec3,scale:Vec3)=>{
        gl.gl.useProgram(fac.program)

        gl.gl.bindBuffer(gl.gl.ARRAY_BUFFER, vertexBuffer);
        gl.gl.bufferData(gl.gl.ARRAY_BUFFER, new Float32Array(model._vertices), gl.gl.STATIC_DRAW)

        gl.gl.bindBuffer(gl.gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
        gl.gl.bufferData(gl.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model._indices), gl.gl.STATIC_DRAW)

        gl.gl.enableVertexAttribArray(aPositionLoc)
        gl.gl.vertexAttribPointer(aPositionLoc, 3, gl.gl.FLOAT, false, 0, 0)

        gl.gl.uniform4f(uColorLoc, mat.color.r, mat.color.g, mat.color.b, mat.color.a)
        gl.gl.uniform3f(uTranslationLoc, position.x, position.y, position.z)
        gl.gl.uniform3f(uScaleLoc, scale.x, scale.y, scale.z)
        gl.gl.uniformMatrix4fv(uProjectionMatrixLoc, false, matrix)

        gl.gl.drawElements(gl.gl.TRIANGLES, model._indices.length, gl.gl.UNSIGNED_SHORT, 0)
    }
    return (arg:GL3D_SimpleMatArgs)=>{
        return {
            ...arg,
            factory:fac,
            draw:draw
        }
    }
}
}

export type GL2D_GridMatArgs={
    color:Color
    width:number
    gridSize:number
}
export const GLF_Grid:GLMaterial2DFactoryCall<GL2D_GridMatArgs>={
    vertex:`
attribute vec2 a_Position;
uniform mat4 u_ProjectionMatrix;
uniform vec3 u_Translation;
varying vec2 v_WorldPosition;

void main() {
    v_WorldPosition = a_Position+u_Translation.xy;
    gl_Position = u_ProjectionMatrix * vec4(a_Position,u_Translation.z, 1.0);
}`,
    frag:`
precision mediump float;
varying vec2 v_WorldPosition;

uniform float u_GridSize;
uniform vec4 u_Color;
uniform float u_LineWidth;

void main() {
    vec2 grid = abs(mod(v_WorldPosition, u_GridSize) - (u_GridSize * 0.5));

    float line = 1.0-step(u_LineWidth, min(grid.x, grid.y));
    gl_FragColor = vec4(u_Color.rgb, line * u_Color.a);
}`,
create(gl:WebglRenderer,fac:GLMaterial2DFactory<GL2D_GridMatArgs>){
    const aPositionLoc=gl.gl.getAttribLocation(fac.program, "a_Position")
    const uColorLoc=gl.gl.getUniformLocation(fac.program, "u_Color")!
    const uGridSize=gl.gl.getUniformLocation(fac.program, "u_GridSize")!
    const uLineWidth=gl.gl.getUniformLocation(fac.program, "u_LineWidth")!
    const uTranslationLoc=gl.gl.getUniformLocation(fac.program, "u_Translation")!
    const uProjectionMatrixLoc=gl.gl.getUniformLocation(fac.program, "u_ProjectionMatrix")!

    const vertexBuffer = gl.gl.createBuffer();
    const draw=(mat:GLMaterial2D<GL2D_GridMatArgs>,matrix:Matrix,model:Model2D,position:Vec2,scale:Vec2)=>{
        gl.gl.useProgram(fac.program)

        gl.gl.bindBuffer(gl.gl.ARRAY_BUFFER, vertexBuffer);
        gl.gl.bufferData(gl.gl.ARRAY_BUFFER, model.vertices, gl.gl.STATIC_DRAW)

        gl.gl.enableVertexAttribArray(aPositionLoc)
        gl.gl.vertexAttribPointer(aPositionLoc, 2, gl.gl.FLOAT, false, 0, 0)

        gl.gl.uniform4f(uColorLoc, mat.color.r, mat.color.g, mat.color.b, mat.color.a)
        gl.gl.uniform2f(uTranslationLoc, position.x, position.y)
        gl.gl.uniform1f(uLineWidth, mat.width)
        gl.gl.uniform1f(uGridSize, mat.gridSize)
        gl.gl.uniformMatrix4fv(uProjectionMatrixLoc, false, matrix)
        gl.gl.drawArrays(gl.gl.TRIANGLES, 0, model.vertices.length / 2)
    }
    return (arg:GL2D_SimpleMatArgs)=>{
        return {
            ...arg,
            factory:fac,
            draw:draw
        }
    }
}
}
export type GL2D_TexMatArgs={
    texture:WebGLTexture
    tint:Color
}
export const GLF_Texture:GLMaterial2DFactoryCall<GL2D_TexMatArgs>={
    vertex:`
attribute vec2 a_Position;
attribute vec2 a_TexCoord;
    
uniform mat4 u_ProjectionMatrix;
uniform vec2 u_Translation;
uniform vec2 u_Scale;

varying highp vec2 vTextureCoord;

void main(void) {
    gl_Position = u_ProjectionMatrix*vec4((a_Position*u_Scale)+u_Translation,0.0,1.0);
    vTextureCoord = a_TexCoord;
}`,
    frag:`
precision mediump float;

varying highp vec2 vTextureCoord;
uniform sampler2D u_Texture;
uniform vec4 u_Tint;

void main(void) {
    vec2 flippedCoord = vec2(vTextureCoord.x, 1.0 - vTextureCoord.y);
    gl_FragColor = texture2D(u_Texture, flippedCoord)*u_Tint;
}`,
create(glr: WebglRenderer, fac: GLMaterial2DFactory<GL2D_TexMatArgs>) {
    const gl = glr.gl
    const aPositionLoc = gl.getAttribLocation(fac.program, "a_Position")
    const aTexCoordLoc = gl.getAttribLocation(fac.program, "a_TexCoord")
    const uTintLoc = gl.getUniformLocation(fac.program, "u_Tint")!
    const uTranslationLoc = gl.getUniformLocation(fac.program, "u_Translation")!
    const uScaleLoc = gl.getUniformLocation(fac.program, "u_Scale")!
    const uProjectionMatrixLoc = gl.getUniformLocation(fac.program, "u_ProjectionMatrix")!
    const uTextureLoc = gl.getUniformLocation(fac.program, "u_Texture")!

    const vertexBuffer = gl.createBuffer()!
    const textureCoordBuffer = gl.createBuffer()!

    const draw = (mat: GLMaterial2D<GL2D_TexMatArgs>, matrix: Matrix, model: Model2D, position: Vec2, scale: Vec2) => {
        gl.useProgram(fac.program)

        // Vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, model.vertices, gl.STATIC_DRAW)
        gl.enableVertexAttribArray(aPositionLoc)
        gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0)

        // TexCoord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, model.tex_coords, gl.STATIC_DRAW)
        gl.enableVertexAttribArray(aTexCoordLoc)
        gl.vertexAttribPointer(aTexCoordLoc, 2, gl.FLOAT, false, 0, 0)

        // Texture
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, mat.texture)
        gl.uniform1i(uTextureLoc, 0)

        // Uniforms
        gl.uniform4f(uTintLoc, mat.tint.r, mat.tint.g, mat.tint.b, mat.tint.a)
        gl.uniform2f(uTranslationLoc, position.x, position.y)
        gl.uniform2f(uScaleLoc, scale.x, scale.y)
        gl.uniformMatrix4fv(uProjectionMatrixLoc, false, matrix)

        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, model.vertices.length / 2)
    }


    return (arg: GL2D_TexMatArgs) => ({
        ...arg,
        factory: fac,
        draw
    })
}
}
export type GL2D_LightMatArgs = {
    color: Color
}

export const GLF_Light: GLMaterial2DFactoryCall<GL2D_LightMatArgs> = {
    vertex: `
attribute vec2 a_Position;
uniform mat4 u_ProjectionMatrix;
uniform vec2 u_Translation;
uniform vec2 u_Scale;
void main() {
    gl_Position = u_ProjectionMatrix * vec4((a_Position * u_Scale) + u_Translation, 0.0, 1.0);
}`,
    frag: `
#ifdef GL_ES
precision mediump float;
#endif

uniform vec4 u_Color;

void main() {
    //gl_FragColor = u_Color;
    gl_FragColor = vec4(u_Color.rgb*u_Color.a,u_Color.a);
}`,

    create(gl, fac) {
        const aPositionLoc = gl.gl.getAttribLocation(fac.program, "a_Position");
        const uColorLoc     = gl.gl.getUniformLocation(fac.program, "u_Color")!;
        const uTranslationLoc = gl.gl.getUniformLocation(fac.program, "u_Translation")!;
        const uScaleLoc = gl.gl.getUniformLocation(fac.program, "u_Scale")!;
        const uProjectionMatrixLoc = gl.gl.getUniformLocation(fac.program, "u_ProjectionMatrix")!;

        const vertexBuffer = gl.gl.createBuffer();

        const draw = (
            mat: GLMaterial2D<GL2D_LightMatArgs>,
            matrix: Matrix,
            model: Model2D,
            position: Vec2,
            scale: Vec2
        ) => {
            gl.gl.useProgram(fac.program)

            gl.gl.bindBuffer(gl.gl.ARRAY_BUFFER, vertexBuffer)
            gl.gl.bufferData(gl.gl.ARRAY_BUFFER, model.vertices, gl.gl.STATIC_DRAW)

            gl.gl.enableVertexAttribArray(aPositionLoc)
            gl.gl.vertexAttribPointer(aPositionLoc, 2, gl.gl.FLOAT, false, 0, 0)

            gl.gl.uniform4f(uColorLoc, mat.color.r, mat.color.g, mat.color.b, mat.color.a)

            gl.gl.uniform2f(uTranslationLoc, position.x, position.y)
            gl.gl.uniform2f(uScaleLoc, scale.x, scale.y)
            gl.gl.uniformMatrix4fv(uProjectionMatrixLoc, false, matrix)

            gl.gl.drawArrays(gl.gl.TRIANGLES, 0, model.vertices.length / 2)
        };

        return (arg: GL2D_LightMatArgs) => ({
            ...arg,
            factory: fac,
            draw
        });
    }
};
export class WebglRenderer extends Renderer {
    readonly gl: WebGLRenderingContext;
    readonly tex_program:WebGLProgram
    readonly factorys2D:{
        simple:GLMaterial2DFactory<GL2D_SimpleMatArgs>,
        grid:GLMaterial2DFactory<GL2D_GridMatArgs>,
        texture:GLMaterial2DFactory<GL2D_TexMatArgs>,
        light:GLMaterial2DFactory<GL2D_LightMatArgs>
    }
    readonly factorys3D:{
        simple:GLMaterial3DFactory<GL3D_SimpleMatArgs>,
    }
    proccess_factory<T>(fac_def:GLMaterial2DFactoryCall<T>):GLMaterial2DFactory<T>{
        const prog=this.createProgram(fac_def.vertex,fac_def.frag)
        const fac={
            program:prog
        }
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        fac.create=fac_def.create(this,fac)
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        return fac
    }
    proccess_factory3<T>(fac_def:GLMaterial3DFactoryCall<T>):GLMaterial3DFactory<T>{
        const prog=this.createProgram(fac_def.vertex,fac_def.frag)
        const fac={
            program:prog
        }
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        fac.create=fac_def.create(this,fac)
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        return fac
    }
    factorys2D_consts:Record<string,Record<string,WebGLUniformLocation|number>>={}
    constructor(canvas: HTMLCanvasElement, background: Color = ColorM.default.white) {
        super(canvas);
        const gl = this.canvas.getContext("webgl", { antialias: true });
        this.background = background;
        this.gl = gl!;
        //Tex Program
        const tex_program = gl!.createProgram();
        gl!.attachShader(tex_program!, this.createShader(texVertexShaderSource, gl!.VERTEX_SHADER))
        gl!.attachShader(tex_program!, this.createShader(texFragmentShaderSource, gl!.FRAGMENT_SHADER))
        this.tex_program = tex_program!
        gl!.linkProgram(this.tex_program)

        this.factorys2D={
            simple:this.proccess_factory(GLF_Simple),
            grid:this.proccess_factory(GLF_Grid),
            texture:this.proccess_factory(GLF_Texture),
            light:this.proccess_factory(GLF_Light)
        }

        this.factorys3D={
            simple:this.proccess_factory3(GLF_Simple3)
        }
        
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
            }))
        })

        canvas.tabIndex = 0
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
    override draw(model:Model2D,material:Material2D,matrix:Matrix,position:Vec2,scale:Vec2):void{
        material.draw(material,matrix,model,position,scale)
    }
    override draw_3d(model:Model3D,material:Material3D,matrix:Matrix,position:Vec3,scale:Vec3):void{
        if(!matrix)return
        material.draw(material,matrix,model,position,scale)
    }

    draw_image2D(image: Frame,position: Vec2,model:Float32Array,matrix:Matrix,tint:Color=ColorM.default.white): void {
        const program=this.tex_program

        const vertexBuffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, model, this.gl.STATIC_DRAW)

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
        this.gl.uniform1i(this.factorys2D_consts["texture_ADV"]["texture"] as WebGLUniformLocation, 0)

        this.gl.uniformMatrix4fv(this.factorys2D_consts["texture_ADV"]["proj"], false, matrix);

        this.gl.uniform2f(this.factorys2D_consts["texture_ADV"]["translation"],position.x,position.y)

        this.gl.uniform4f(this.factorys2D_consts["texture_ADV"]["tint"],tint.r,tint.g,tint.b,tint.a)

        this.gl.drawArrays(this.gl.TRIANGLES, 0, model.length / 2)

        /*this.gl.deleteBuffer(textureCoordBuffer)
        this.gl.deleteBuffer(vertexBuffer)*/
    }

    clear() {
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
        this.gl.clearColor(this.background.r, this.background.g, this.background.b, 1)
        this.canvas.style.backgroundColor=`rgb(${0},${0},${0})`
        this.gl.clear(this.gl.COLOR_BUFFER_BIT |this.gl.DEPTH_BUFFER_BIT);
        
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

    canvas.tabIndex = 0
    canvas.focus()
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
