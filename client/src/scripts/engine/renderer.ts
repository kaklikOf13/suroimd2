import { CircleHitbox2D, Hitbox2D, HitboxType2D, NullVec2, RectHitbox2D, Vec2, matrix4, v2 } from "common/scripts/engine/mod.ts"
import { type Sprite } from "./resources.ts";
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
    constructor(canvas: HTMLCanvasElement, meter_size: number = 100) {
        this.canvas = canvas
        this.meter_size = meter_size
    }
    abstract draw_rect2D(rect: RectHitbox2D, normal: Color,offset?:Vec2): void
    abstract draw_circle2D(circle: CircleHitbox2D, normal: Color,offset?:Vec2): void
    abstract draw_hitbox2D(hitbox: Hitbox2D, normal: Color,offset?:Vec2): void
    abstract draw_image2D(image: Sprite, position: Vec2, size: Vec2,offset?:Vec2): void
    
    abstract clear(): void
}

const rectVertexShaderSource = `
attribute vec2 a_Position;
uniform mat4 u_ProjectionMatrix;

void main() {
    gl_Position = u_ProjectionMatrix * vec4(a_Position, 0.0, 1.0);
}`;

const rectFragmentShaderSource = `
#ifdef GL_ES
precision highp float;
#endif
uniform vec4 a_Color;

void main() {
    gl_FragColor = a_Color;
}`;

export class GLMaterialFactory{
    program:WebGLProgram
    attributes:Record<string,number>
    uniforms:Partial<Record<string,WebGLUniformLocation>>
    renderer:WebglRenderer
    vertexAttributeArray:boolean=true
    constructor(vertexShader:string,fragShader:string,renderer:WebglRenderer){
        this.renderer = renderer;
        
        // Create shaders
        const vertex = renderer.createShader(vertexShader, renderer.gl.VERTEX_SHADER);
        const frag = renderer.createShader(fragShader, renderer.gl.FRAGMENT_SHADER);
        
        // Create and link program
        const program = renderer.gl.createProgram();
        if (!program) {
            throw new Error("Failed to create WebGL program");
        }
        renderer.gl.attachShader(program, vertex);
        renderer.gl.attachShader(program, frag);
        renderer.gl.linkProgram(program);
        
        // Check program link status
        if (!renderer.gl.getProgramParameter(program, renderer.gl.LINK_STATUS)) {
            const info = renderer.gl.getProgramInfoLog(program);
            throw new Error(`Failed to link program: ${info}`);
        }
        
        this.program = program;
        this.attributes = {};
        this.uniforms = {};
    }
    add_attrL(name:string){
        this.attributes[name]=this.renderer.gl.getAttribLocation(this.program,name)
    }
    add_uniformL(name:string){
        this.uniforms[name]=this.renderer.gl.getUniformLocation(this.program,name)||undefined
    }
    generateMaterial(color?:Color,texture?:Sprite,lightAffect:boolean=true):GLMaterial{
        return {
            factory:this,
            color,
            texture,
            lightAffect
        }
    }
}
export interface GLMaterial{
    factory:GLMaterialFactory
    color?:Color
    texture?:Sprite
    lightAffect?:boolean
}

export class WebglRenderer extends Renderer {
    readonly gl: WebGLRenderingContext;
    background: Color = RGBA.new(255, 255, 255);
    readonly projectionMatrix: Float32Array;
    readonly simple_program:WebGLProgram
    constructor(canvas: HTMLCanvasElement, meter_size: number = 100, background: Color = RGBA.new(255, 255, 255),depth:number=500) {
        super(canvas, meter_size);
        const gl = this.canvas.getContext("webgl");
        this.background = background;
        this.gl = gl!;

        const simple_program = gl!.createProgram();
        gl!.attachShader(simple_program!, this.createShader(rectVertexShaderSource, gl!.VERTEX_SHADER))
        gl!.attachShader(simple_program!, this.createShader(rectFragmentShaderSource, gl!.FRAGMENT_SHADER))
        this.simple_program = simple_program!
        gl!.linkProgram(this.simple_program)


        // Configurando a matriz de projeção para coordenadas de pixel
        const scaleX = this.canvas.width / this.meter_size
        const scaleY = this.canvas.height / this.meter_size
        this.projectionMatrix = new Float32Array(matrix4.projection(v2.new(scaleX,scaleY),depth/this.meter_size))

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

    _draw_vertices(vertices: number[], normal: Color, mode: number = this.gl.TRIANGLES) {
        const vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
        this.gl.useProgram(this.simple_program);

        const positionAttributeLocation = this.gl.getAttribLocation(this.simple_program, "a_Position");
        this.gl.enableVertexAttribArray(positionAttributeLocation);
        this.gl.vertexAttribPointer(positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

        const colorUniformLocation = this.gl.getUniformLocation(this.simple_program, "a_Color");
        this.gl.uniform4f(colorUniformLocation, normal.r, normal.g, normal.b, normal.a);

        const projectionMatrixLocation = this.gl.getUniformLocation(this.simple_program, "u_ProjectionMatrix");
        this.gl.uniformMatrix4fv(projectionMatrixLocation, false, this.projectionMatrix);

        this.gl.drawArrays(mode, 0, vertices.length / 2);
    }

    draw_rect2D(rect: RectHitbox2D, normal: Color,offset:Vec2=NullVec2) {
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
        ], normal);
    }

    draw_circle2D(circle: CircleHitbox2D, normal: Color,offset:Vec2=NullVec2 , precision: number = 50): void {
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
        this._draw_vertices(vertices, normal, this.gl.TRIANGLE_FAN)
    }

    draw_hitbox2D(hitbox: Hitbox2D, normal: Color,offset:Vec2=NullVec2): void {
        switch (hitbox.type) {
            case HitboxType2D.circle:
                this.draw_circle2D(hitbox, normal,offset)
                break;
            case HitboxType2D.rect:
                this.draw_rect2D(hitbox, normal,offset)
                break;
            default:
                return;
        }
    }

    draw_image2D(image: Sprite, position: Vec2, size: Vec2,offset:Vec2=NullVec2): void {
        const x1 = position.x-offset.x
        const y1 = position.y-offset.y
        const x2 = (position.x-offset.x) + size.x
        const y2 = (position.y-offset.y) + size.y
    
        const vertices: number[] = [
            x1, y1,
            x2, y1,
            x1, y2,
            x1, y2,
            x2, y1,
            x2, y2
        ];
    
        const textureCoordinates: number[] = [
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            1.0, 1.0
        ];
    
        const vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
    
        const textureCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), this.gl.STATIC_DRAW);
    
        this.gl.useProgram(this.simple_program);
    
        const positionAttributeLocation = this.gl.getAttribLocation(this.simple_program, "a_Position");
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.enableVertexAttribArray(positionAttributeLocation);
        this.gl.vertexAttribPointer(positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
    
        const texCoordAttributeLocation = this.gl.getAttribLocation(this.simple_program, "a_TexCoord");
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoordBuffer);
        this.gl.enableVertexAttribArray(texCoordAttributeLocation);
        this.gl.vertexAttribPointer(texCoordAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
    
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image.source);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)
    
        const colorUniformLocation = this.gl.getUniformLocation(this.simple_program, "u_Color");
        this.gl.uniform4f(colorUniformLocation, 1.0, 1.0, 1.0, 1.0);
    
        const projectionMatrixLocation = this.gl.getUniformLocation(this.simple_program, "u_ProjectionMatrix");
        this.gl.uniformMatrix4fv(projectionMatrixLocation, false, this.projectionMatrix);
    
        this.gl.drawArrays(this.gl.TRIANGLES, 0, vertices.length / 2);
    }

    clear() {
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
        this.gl.clearColor(this.background.r, this.background.g, this.background.b, this.background.a)
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
        this.gl.enable(this.gl.DEPTH_TEST);
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
