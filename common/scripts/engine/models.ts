import { RadAngle, v2, v3, Vec2, Vec3 } from "./geometry.ts"
import { HitboxType2D, type Hitbox2D } from "./hitbox.ts"

export type Matrix=Float32Array
export const matrix4={
    identity(): Matrix {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    },
    projection(size:Vec2,depth:number):Matrix{
        return new Float32Array([
           2 / size.x, 0, 0, 0,
           0, -2 / size.y, 0, 0,
           0, 0, 2 / depth, 0,
          -1, 1, 0, 1,
        ]);
    },
    translation_2d(v:Vec2):Matrix{
        return new Float32Array([
            1,  0,  0,  0,
            0,  1,  0,  0,
            0,  0,  1,  0,
            v.x, v.y, 0, 1,
        ])
    },
    translation_3d(v:Vec3) {
        return new Float32Array([
            1,  0,  0,  0,
            0,  1,  0,  0,
            0,  0,  1,  0,
            v.x, v.y, v.z, 1,
        ])
    },
    scale_3d(v:Vec3) {
        return new Float32Array([
            v.x, 0,  0,  0,
            0, v.y,  0,  0,
            0,  0, v.z,  0,
            0,  0,  0,  1,
        ])
    },
    perspective(fov:number, aspect:number, near:number, far:number) {
        const f = Math.tan(Math.PI * 0.5 - 0.5 * fov)
        const rangeInv = 1.0 / (near - far)
    
        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ])
    },
    mult(a:Matrix, b:Matrix):Matrix{
        const a00 = a[0 * 4 + 0]
        const a01 = a[0 * 4 + 1]
        const a02 = a[0 * 4 + 2]
        const a03 = a[0 * 4 + 3]
        const a10 = a[1 * 4 + 0]
        const a11 = a[1 * 4 + 1]
        const a12 = a[1 * 4 + 2]
        const a13 = a[1 * 4 + 3]
        const a20 = a[2 * 4 + 0]
        const a21 = a[2 * 4 + 1]
        const a22 = a[2 * 4 + 2]
        const a23 = a[2 * 4 + 3]
        const a30 = a[3 * 4 + 0]
        const a31 = a[3 * 4 + 1]
        const a32 = a[3 * 4 + 2]
        const a33 = a[3 * 4 + 3]
        const b00 = b[0 * 4 + 0]
        const b01 = b[0 * 4 + 1]
        const b02 = b[0 * 4 + 2]
        const b03 = b[0 * 4 + 3]
        const b10 = b[1 * 4 + 0]
        const b11 = b[1 * 4 + 1]
        const b12 = b[1 * 4 + 2]
        const b13 = b[1 * 4 + 3]
        const b20 = b[2 * 4 + 0]
        const b21 = b[2 * 4 + 1]
        const b22 = b[2 * 4 + 2]
        const b23 = b[2 * 4 + 3]
        const b30 = b[3 * 4 + 0]
        const b31 = b[3 * 4 + 1]
        const b32 = b[3 * 4 + 2]
        const b33 = b[3 * 4 + 3]
        return new Float32Array([
          b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
          b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
          b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
          b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
          b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
          b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
          b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
          b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
          b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
          b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
          b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
          b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
          b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
          b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
          b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
          b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
        ])
    },
    xRotation(angle:RadAngle):Matrix{
        const c = Math.cos(angle)
        const s = Math.sin(angle)
    
        return new Float32Array([
          1, 0, 0, 0,
          0, c, s, 0,
          0, -s, c, 0,
          0, 0, 0, 1,
        ])
    },
    
    yRotation(angle:RadAngle):Matrix{
        const c = Math.cos(angle)
        const s = Math.sin(angle)

        return new Float32Array([
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1,
        ])
    },

    zRotation(angle:RadAngle):Matrix{
        const c = Math.cos(angle)
        const s = Math.sin(angle)

        return new Float32Array([
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ])
    },
}

export interface Model2D{
    vertices:Float32Array
    tex_coords:Float32Array
}
function rotatePoint(x:number, y:number, angle:number) {
    const cosTheta = Math.cos(angle);
    const sinTheta = Math.sin(angle);
    return {
        x: cosTheta * x - sinTheta * y,
        y: sinTheta * x + cosTheta * y
    };
}
export function ImageModel2D(scale: Vec2, angle: number, hotspot: Vec2=v2.new(0,0),size:Vec2,meter_size:number=100):Float32Array{
    const sizeR=v2.new((size.x/meter_size)*(scale.x/2),(size.y/meter_size)*(scale.y/2))
    const x1 = -sizeR.x*hotspot.x
    const y1 = -sizeR.y*hotspot.y
    const x2 = sizeR.x+x1
    const y2 = sizeR.y+y1

    const verticesB = [
        { x: x1, y: y1 },
        { x: x2, y: y1 },
        { x: x1, y: y2 },
        { x: x2, y: y2 }
    ];
    const verticesR = verticesB.map(vertex => rotatePoint(vertex.x, vertex.y, angle))

    return new Float32Array([
        verticesR[0].x, verticesR[0].y,
        verticesR[1].x, verticesR[1].y,
        verticesR[2].x, verticesR[2].y,
        
        verticesR[2].x, verticesR[2].y,
        verticesR[1].x, verticesR[1].y,
        verticesR[3].x, verticesR[3].y
    ])
}
export function ImageModel3D(
    scale: Vec2,
    angle: { x: number; y: number; z: number }, // rotação em rad em 3 eixos
    hotspot: Vec2 = v2.new(0, 0),
    size: Vec2,
    meter_size: number = 100
): Float32Array {
    const sizeR = v2.new(
        (size.x / meter_size) * (scale.x / 2),
        (size.y / meter_size) * (scale.y / 2)
    );
    const x1 = -sizeR.x * hotspot.x;
    const y1 = -sizeR.y * hotspot.y;
    const x2 = sizeR.x + x1;
    const y2 = sizeR.y + y1;

    const verticesB = [
        { x: x1, y: y1, z: 0 },
        { x: x2, y: y1, z: 0 },
        { x: x1, y: y2, z: 0 },
        { x: x2, y: y2, z: 0 }
    ];

    const verticesR = verticesB.map(v => rotate3D(v, angle));

    return new Float32Array([
        verticesR[0].x, verticesR[0].y, verticesR[0].z,
        verticesR[1].x, verticesR[1].y, verticesR[1].z,
        verticesR[2].x, verticesR[2].y, verticesR[2].z,

        verticesR[2].x, verticesR[2].y, verticesR[2].z,
        verticesR[1].x, verticesR[1].y, verticesR[1].z,
        verticesR[3].x, verticesR[3].y, verticesR[3].z
    ]);
}

function rotate3D(v: { x: number; y: number; z: number }, angle: { x: number; y: number; z: number }) {
    let { x, y, z } = v;

    let cy = Math.cos(angle.x), sy = Math.sin(angle.x);
    let y1 = y * cy - z * sy;
    let z1 = y * sy + z * cy;

    y = y1; z = z1

    let cx = Math.cos(angle.y), sx = Math.sin(angle.y);
    let x1 = x * cx + z * sx;
    let z2 = -x * sx + z * cx;

    x = x1; z = z2;

    let cz = Math.cos(angle.z), sz = Math.sin(angle.z);
    let x2 = x * cz - y * sz;
    let y2 = x * sz + y * cz;

    return { x: x2, y: y2, z };
}


export const model2d={
    line(start: Vec2, end: Vec2, width: number): Model2D {
        const dx = end.x - start.x;
        const dy = end.y - start.y;

        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return {vertices:new Float32Array(0),tex_coords:new Float32Array([])};

        const angle = Math.atan2(dy, dx);
        const halfW = width / 2;

        const verticesBase = [
            { x: 0,    y:  halfW },
            { x: len,  y:  halfW },
            { x: 0,    y: -halfW },
            { x: len,  y: -halfW }
        ];

        const verticesRotated = verticesBase.map(v => rotatePoint(v.x, v.y, angle));

        const verticesTranslated = verticesRotated.map(v => ({
            x: v.x + start.x,
            y: v.y + start.y
        }));

        return {vertices:new Float32Array([
            verticesTranslated[0].x, verticesTranslated[0].y,
            verticesTranslated[1].x, verticesTranslated[1].y,
            verticesTranslated[2].x, verticesTranslated[2].y,

            verticesTranslated[2].x, verticesTranslated[2].y,
            verticesTranslated[1].x, verticesTranslated[1].y,
            verticesTranslated[3].x, verticesTranslated[3].y
        ]),tex_coords:new Float32Array()};
    },
    outlineCircle(
        radius: number,
        width: number,
        segments: number = 24,
        center: Vec2 = v2.new(0, 0)
    ): Model2D {
        const vertices: number[] = [];

        const angleStep = (Math.PI * 2) / segments;

        const outer: Vec2[] = [];
        const inner: Vec2[] = [];

        for (let i = 0; i < segments; i++) {
            const theta = i * angleStep;

            const cos = Math.cos(theta);
            const sin = Math.sin(theta);
            outer.push({
                x: center.x + cos * (radius + width),
                y: center.y + sin * (radius + width),
            });
            inner.push({
                x: center.x + cos * radius,
                y: center.y + sin * radius,
            });
        }

        for (let i = 0; i < segments; i++) {
            const iNext = (i + 1) % segments

            const i0 = inner[i]
            const i1 = inner[iNext]
            const o0 = outer[i]
            const o1 = outer[iNext]

            vertices.push(i0.x, i0.y, o0.x, o0.y, o1.x, o1.y)

            vertices.push(i0.x, i0.y, o1.x, o1.y, i1.x, i1.y)
        }

        return {
            vertices: new Float32Array(vertices),
            tex_coords: new Float32Array([]),
        };
    },

    circle(
        radius: number,
        segments: number = 24,
        center: Vec2 = v2.new(0, 0)
    ): Model2D {
        const vertices: number[] = [];
        const tex_coords: number[] = [];

        const angleStep = (Math.PI * 2) / segments;

        for (let i = 0; i < segments; i++) {
            const theta0 = i * angleStep;
            const theta1 = (i + 1) * angleStep;

            const x0 = center.x + Math.cos(theta0) * radius;
            const y0 = center.y + Math.sin(theta0) * radius;
            const x1 = center.x + Math.cos(theta1) * radius;
            const y1 = center.y + Math.sin(theta1) * radius;

            // triângulo do centro -> ponto0 -> ponto1
            vertices.push(
            center.x, center.y,
            x0, y0,
            x1, y1
            );
        }

        return {
            vertices: new Float32Array(vertices),
            tex_coords: new Float32Array(tex_coords),
        };
    },
    outline(model: Model2D, width: number): Model2D {
        const vertices: number[] = []

        const segments = model.vertices.length / 6
        const angleStep = (Math.PI * 2) / segments

        const outer: Vec2[] = []
        const inner: Vec2[] = []

        for (let i = 0; i < segments; i++) {
            const theta = i * angleStep

            const x = Math.cos(theta)
            const y = Math.sin(theta)

            outer.push({ x: (x * (width + 1)), y: (y * (width + 1)) })
            inner.push({ x: (x * (1 - width)), y: (y * (1 - width)) })
        }

        for (let i = 0; i < segments; i++) {
            const iNext = (i + 1) % segments

            const i0 = inner[i]
            const i1 = inner[iNext]
            const o0 = outer[i]
            const o1 = outer[iNext]

            vertices.push(i0.x, i0.y, o0.x, o0.y, o1.x, o1.y)

            vertices.push(i0.x, i0.y, o1.x, o1.y, i1.x, i1.y)
        }

        return {
            vertices: new Float32Array(vertices),
            tex_coords: new Float32Array([]),
        }
    },
    rect(
        pos_min: Vec2 = v2.new(0, 0),
        pos_max: Vec2 = v2.new(1, 1),
        tex_min: Vec2 = v2.new(0, 0),
        tex_max: Vec2 = v2.new(1, 1)
    ): Model2D {
        return {
            vertices: new Float32Array([
                pos_min.x, pos_max.y, // top-left
                pos_max.x, pos_max.y, // top-right
                pos_min.x, pos_min.y, // bottom-left

                pos_min.x, pos_min.y, // bottom-left
                pos_max.x, pos_max.y, // top-right
                pos_max.x, pos_min.y  // bottom-right
            ]),
            tex_coords: new Float32Array([
                tex_min.x, tex_max.y, // top-left
                tex_max.x, tex_max.y, // top-right
                tex_min.x, tex_min.y, // bottom-left

                tex_min.x, tex_min.y, // bottom-left
                tex_max.x, tex_max.y, // top-right
                tex_max.x, tex_min.y  // bottom-right
            ])
        }
    },
    hitbox(hb:Hitbox2D):Model2D{
        if(hb.type===HitboxType2D.rect){
            return this.rect(hb.min,hb.max)
        }else if(hb.type===HitboxType2D.circle){
            return this.circle(hb.radius,undefined,hb.position)
        }
        return {
            tex_coords:new Float32Array([]),
            vertices:new Float32Array([])
        }
    }
}
export interface Face3{
    p1:Vec3
    p2:Vec3
    p3:Vec3
    normal?:{
        p1:Vec3
        p2:Vec3
        p3:Vec3
    }
    texture?:{
        p1:Vec3
        p2:Vec3
        p3:Vec3
    }
}
export interface Face4{
    p1:Vec3 // Left Top
    p2:Vec3 // Right Top
    p3:Vec3 // Right Bottom
    p4:Vec3 // Left Bottom
    normal?:{
        p1:Vec3 // Left Top
        p2:Vec3 // Right Top
        p3:Vec3 // Right Bottom
        p4:Vec3 // Left Bottom
    }
    texture?:{
        p1:Vec3 // Left Top
        p2:Vec3 // Right Top
        p3:Vec3 // Right Bottom
        p4:Vec3 // Left Bottom
    }
}
export interface FaceId{
    p1:number
    p2:number
    p3:number
    i:number
    normal?:{
        p1:number
        p2:number
        p3:number
        i:number
    }
    texture?:{
        p1:number
        p2:number
        p3:number
        i:number
    }
}
export class Model3D{
    _vertices: number[]
    _indices: number[]
    _normalsM:number[]
    _normals: number[]
    _texCoords:number[]
    _texCoordsM:number[]
    constructor(){
        this._vertices=[]
        this._indices=[]
        this._normals=[]
        this._normalsM=[]
        this._texCoords=[]
        this._texCoordsM=[]
    }
    addFace3(face:Face3):FaceId{
        const ret:FaceId={p1:-1,p2:-1,p3:-1,i:0}

        for(let i=0;i<this._vertices.length;i+=3){
            const v=v3.new(-this._vertices[i],this._vertices[i+1],this._vertices[i+2])
            if(v3.is(face.p1,v)){
                ret.p1=i
            }
            if(v3.is(face.p2,v)){
                ret.p2=i
            }
            if(v3.is(face.p3,v)){
                ret.p3=i
            }
        }

        ret.i=this._indices.length
        if(ret.p1===-1){
            this._indices.push(Math.floor(this._vertices.length/3))
            ret.p1=this._vertices.length
            this._vertices.push(-face.p1.x,face.p1.y,face.p1.z)
        }else{
            this._indices.push(Math.floor(ret.p1/3))
        }

        if(ret.p2===-1){
            this._indices.push(Math.floor(this._vertices.length/3))
            ret.p2=this._vertices.length
            this._vertices.push(-face.p2.x,face.p2.y,face.p2.z)
        }else{
            this._indices.push(Math.floor(ret.p2/3))
        }

        if(ret.p3===-1){
            this._indices.push(Math.floor(this._vertices.length/3))
            ret.p3=this._vertices.length
            this._vertices.push(-face.p3.x,face.p3.y,face.p3.z)
        }else{
            this._indices.push(Math.floor(ret.p3/3))
        }

        if(face.normal){
            ret.normal={
                p1:-1,
                p2:-1,
                p3:-1,
                i:this._normalsM.length
            }
            for(let i=0;i<this._normals.length;i+=3){
                const v=v3.new(this._normals[i],this._normals[i+1],this._normals[i+2])
                if(v3.is(face.normal.p1,v)){
                    ret.normal.p1=i
                }
                if(v3.is(face.normal.p2,v)){
                    ret.normal.p2=i
                }
                if(v3.is(face.normal.p3,v)){
                    ret.normal.p3=i
                }
            }

            if(ret.normal.p1===-1){
                this._normalsM.push(Math.floor(this._normals.length/3))
                ret.normal.p1=this._normals.length
                this._normals.push(face.normal.p1.x,face.normal.p1.y,face.normal.p1.z)
            }else{
                this._normalsM.push(Math.floor(ret.normal.p1/3))
            }
    
            if(ret.normal.p2===-1){
                this._normalsM.push(Math.floor(this._normals.length/3))
                ret.normal.p2=this._vertices.length
                this._normals.push(face.normal.p2.x,face.normal.p2.y,face.normal.p2.z)
            }else{
                this._normalsM.push(Math.floor(ret.normal.p2/3))
            }
    
            if(ret.normal.p3===-1){
                this._normalsM.push(Math.floor(this._normals.length/3))
                ret.normal.p3=this._normals.length
                this._normals.push(face.normal.p3.x,face.normal.p3.y,face.normal.p3.z)
            }else{
                this._normalsM.push(Math.floor(ret.normal.p3/3))
            }
        }
        if(face.texture){
            ret.texture={
                p1:-1,
                p2:-1,
                p3:-1,
                i:this._normalsM.length
            }
            for(let i=0;i<this._texCoords.length;i+=3){
                const v=v3.new(this._texCoords[i],this._texCoords[i+1],this._texCoords[i+2])
                if(v3.is(face.texture.p1,v)){
                    ret.texture.p1=i
                }
                if(v3.is(face.texture.p2,v)){
                    ret.texture.p2=i
                }
                if(v3.is(face.texture.p3,v)){
                    ret.texture.p3=i
                }
            }

            if(ret.texture.p1===-1){
                this._texCoordsM.push(Math.floor(this._texCoords.length/3))
                ret.texture.p1=this._normals.length
                this._texCoords.push(face.texture.p1.x,face.texture.p1.y,face.texture.p1.z)
            }else{
                this._texCoordsM.push(Math.floor(ret.texture.p1/3))
            }

            if(ret.texture.p2===-1){
                this._texCoordsM.push(Math.floor(this._texCoords.length/3))
                ret.texture.p2=this._normals.length
                this._texCoords.push(face.texture.p2.x,face.texture.p2.y,face.texture.p2.z)
            }else{
                this._texCoordsM.push(Math.floor(ret.texture.p2/3))
            }

            if(ret.texture.p3===-1){
                this._texCoordsM.push(Math.floor(this._texCoords.length/3))
                ret.texture.p3=this._normals.length
                this._texCoords.push(face.texture.p3.x,face.texture.p3.y,face.texture.p3.z)
            }else{
                this._texCoordsM.push(Math.floor(ret.texture.p3/3))
            }
        }
        return ret
    }
    addFace4(face:Face4):{0:FaceId,1:FaceId}{
        const f1=this.addFace3({
            p1:face.p1,
            p2:face.p2,
            p3:face.p3,
            normal:face.normal?{
                p1:face.normal.p1,
                p2:face.normal.p2,
                p3:face.normal.p3,
            }:undefined,
            texture:face.texture?{
                p1:face.texture.p1,
                p2:face.texture.p2,
                p3:face.texture.p3,
            }:undefined
        })
        const f2=this.addFace3({
            p1:face.p1,
            p2:face.p4,
            p3:face.p3,
            normal:face.normal?{
                p1:face.normal.p1,
                p2:face.normal.p4,
                p3:face.normal.p3,
            }:undefined,
            texture:face.texture?{
                p1:face.texture.p1,
                p2:face.texture.p4,
                p3:face.texture.p3,
            }:undefined
        })
        return {0:f1,1:f2}
    }
}
export const model3d=Object.freeze({
    cube(s:number=1){
        const ret=new Model3D()
        ret._vertices = [
            // Front face
            0, 0, s,
            -s, 0, s,
            -s, s, s,
            0, s, s,
    
            // Back face
            0, 0, 0,
            -s, 0, 0,
            -s, s, 0,
            0, s, 0,
        ]
        ret._normals.push(
            // Normals for the front face
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,

            // Normals for the back face
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,

            // Normals for the top face
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,

            // Normals for the bottom face
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,

            // Normals for the right face
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,

            // Normals for the left face
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
        )

        // Define the indices
        ret._indices = [
            // Front face
            0, 1, 2, 0, 2, 3,
            // Back face
            4, 5, 6, 4, 6, 7,
            // Top face
            3, 2, 6, 3, 6, 7,
            // Bottom face
            0, 1, 5, 0, 5, 4,
            // Right face
            1, 2, 6, 1, 6, 5,
            // Left face
            0, 3, 7, 0, 7, 4
        ]
        return ret
    },
    parseObj(objText: string):Model3D{
        const ret=new Model3D()
        const lines = objText.split('\n')
        for (let line of lines) {
            line = line.trim()
            if (line.startsWith('v ')) {
              const parts = line.split(/\s+/)
              const vertex = parts.slice(1).map(parseFloat)
              vertex[0]*=-1
              ret._vertices.push(...vertex)
            } else if (line.startsWith('vn ')) {
              const parts = line.split(/\s+/)
              const normal = parts.slice(1).map(parseFloat)
              ret._normals.push(...normal)
            } else if (line.startsWith('vt ')) {
              const parts = line.split(/\s+/)
              const textureCoord = parts.slice(1).map(parseFloat)
              ret._texCoords.push(...textureCoord)
            } else if (line.startsWith('f ')) {
              const parts = line.split(/\s+/).slice(1)
              const vertices:number[] = []
              const textures:number[] = []
              const normals:number[] = []
        
              for (const part of parts) {
                const [v, vt, vn] = part.split('/').map(str => parseInt(str) - 1)
                vertices.push(v)
                if (vt !== undefined) textures.push(vt)
                if (vn !== undefined) normals.push(vn)
              }
        
              ret._indices.push(...vertices)
              ret._normalsM.push(...normals)
              ret._texCoordsM.push(...textures)
            }
        }
        return ret
    },
})