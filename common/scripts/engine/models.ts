import { RadAngle, v2, Vec2 } from "./geometry.ts";

export type Matrix=Float32Array
export const matrix4={
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
    },rect(
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
        };
    }
}