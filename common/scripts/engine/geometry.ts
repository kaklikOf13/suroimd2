import { random } from "./random.ts"
export interface Vec2{
    x:number
    y:number
}
export type RadAngle=number
export type DegAngle=number
function float32ToUint32(value: number): number {
    const floatView = new Float32Array(1)
    const intView = new Uint32Array(floatView.buffer)
    floatView[0] = value
    return intView[0]
}


const prime1 = BigInt("2654435761")
const prime2 = BigInt("2246822519")

export enum RotationMode{
    null,
    limited,
    full
}

export type HashVec2=bigint

export const v2 = Object.freeze({
    /**
     * Creates a new `Vec2`
     * @param x The horizontal (x-axis) coordinate
     * @param y The vertical (y-axis) coordinate
     * @returns A new `Vec2` With X and Y Cords
     */
    new(x:number, y:number): Vec2 {
        return {x, y}
    },
    /**
     * Return Random Vec2
     */
    random(min:number, max:number):Vec2 {
        return {x:random.float(min,max),y:random.float(min,max)}
    },
    random2(min:Vec2, max:Vec2):Vec2 {
        return {x:random.float(min.x,max.x),y:random.float(min.y,max.y)}
    },
    /**
     * @param x `Vec21`
     * @param y `Vec22`
     * @returns A new `Vec2` With `x`+`y`
     */
    add(x:Vec2, y:Vec2):Vec2 {
        return this.new(x.x+y.x,x.y+y.y)
    },
    /**
     * @param x `Vec21`
     * @param y `Vec22`
     * @returns A new `Vec2` With `x`-`y`
     */
    sub(x:Vec2, y:Vec2):Vec2 {
        return this.new(x.x-y.x,x.y-y.y)
    },
    /**
     * @param x `Vec21`
     * @param y `Vec22`
     * @returns A new `Vec2` With `x`*`y`
     */
    mult(x:Vec2, y:Vec2):Vec2 {
        return this.new(x.x*y.x,x.y*y.y)
    },
    /**
     * @param x `Vec21`
     * @param y `Vec22`
     * @returns A new `Vec2` With `x`/`y`
     */
    div(x:Vec2, y:Vec2):Vec2 {
        return this.new(x.x/y.x,x.y/y.y)
    },
    /**
     * @param x `Vec21`
     * @param y `Vec22`
     * @returns `boolean` of operation `x`>`y`
     */
    greater(x:Vec2, y:Vec2):boolean {
        return x.x>y.x&&x.y>y.y
    },
    /**
     * @param x `Vec21`
     * @param y `Vec22`
     * @returns `boolean` of operation `x`<`y`
     */
    less(x:Vec2, y:Vec2):boolean {
        return x.x<y.x&&x.y<y.y
    },
    /**
     * @param x `Vec21`
     * @param y `Vec22`
     * @returns `boolean` of operation `x`==`y`
     */
    is(x:Vec2, y:Vec2):boolean {
        return x.x==y.x&&x.y==y.y
    },
    /**
     * @param Vec2 `Vec2`
     * @param scale `Scale`
     * @returns A new `Vec2` With `Vec2`*`scale`
     */
    scale(Vec2:Vec2, scale:number):Vec2 {
        return this.new(Vec2.x*scale,Vec2.y*scale)
    },
    /**
     * @param Vec2 `Vec2`
     * @param dscale `DeScale`
     * @returns A new `Vec2` With `Vec2`/`dscale`
     */
    dscale(Vec2:Vec2, dscale:number):Vec2 {
        return this.new(Vec2.x/dscale,Vec2.y/dscale)
    },
    /**
     * 
     * @param Vec2 `Vec2`
     * @param min `Limit`
     * @returns A new `Vec2` With Limit down 
     */
    min1(Vec2:Vec2,min:number):Vec2{
        return this.new(Math.max(Vec2.x,min),Math.max(Vec2.y,min))
    },
    /**
     * 
     * @param x `Vec2`
     * @param y `Limit`
     * @returns A new `Vec2` With Limit down
     */
    min2(x:Vec2,y:Vec2):Vec2{
        return this.new(Math.max(x.x,y.x),Math.max(x.y,y.y))
    },
    /**
     * 
     * @param Vec2 `Vec2`
     * @param max `Limit`
     * @returns A new `Vec2` With Limit down 
     */
    max1(Vec2:Vec2,max:number):Vec2{
        return this.new(Math.min(Vec2.x,max),Math.min(Vec2.y,max))
    },
    /**
     * 
     * @param x `Vec2`
     * @param y `Limit`
     * @returns A new `Vec2` With Limit up
     */
    max2(x:Vec2,y:Vec2):Vec2{
        return this.new(Math.min(x.x,y.x),Math.min(x.y,y.y))
    },

    /**
     * 
     * @param Vec2 `Vec2`
     * @param min `Min Limit`
     * @param max `Max Limit`
     * @returns A new `Vec2` With Limit
     */
    clamp1(Vec2:Vec2,min:number,max:number):Vec2{
        return this.new(Math.max(Math.min(Vec2.x,max),min),Math.max(Math.min(Vec2.y,max),min))
    },
    /**
     * 
     * @param Vec2 `Vec2`
     * @param min `Min Limit`
     * @param max `Max Limit`
     * @returns A new `Vec2` With Limit
     */
    clamp2(Vec2:Vec2,min:Vec2,max:Vec2):Vec2{
        return this.new(Math.max(Math.min(Vec2.x,max.x),min.x),Math.max(Math.min(Vec2.y,max.y),min.y))
    },
    /**
     * 
     * @param vec The Vector
     * @param decimalPlaces `number of max decimals`
     * @returns max decimal `Vec2`
     */
    maxDecimal(vec:Vec2,decimalPlaces:number=3):Vec2{
        const factor = Math.pow(10, decimalPlaces)
        return this.new(Math.round(vec.x * factor) / factor,Math.round(vec.y * factor) / factor)
    },
    /**
     * 
     * @param vec `Vec2`
     * @returns Rounded`Vec2`
     */
    round(vec:Vec2):Vec2{
        return this.new(Math.round(vec.x),Math.round(vec.y))
    },
    /**
     * @param x `Vec21`
     * @param y `Vec22`
     * @returns A `RadAngle` of 2 Vec2s
     */
    lookTo(x:Vec2, y:Vec2):RadAngle {
        return Math.atan2(y.y-x.y,y.x-x.x)
    },
    /**
     * 
     * @param angle `Radians Angle`
     * @returns A new `Vec2` With angle pos
     */
    from_RadAngle(angle:RadAngle):Vec2 {
        return this.new(Math.cos(angle),Math.sin(angle) )
    },
    /**
     * 
     * @param angle `Degrese Angle`
     * @returns A new `Vec2` With angle pos
     */
    from_DegAngle(angle:DegAngle):Vec2 {
        const a=Angle.deg2rad(angle)
        return this.new(Math.cos(a),Math.sin(a))
    },
    /**
     * 
     * @param angle `Radians Angle`
     * @returns A new `Vec2` With angle pos
     */
    rotate_RadAngle(vec:Vec2,angle:RadAngle):Vec2 {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return this.new(vec.x * cos - vec.y * sin, vec.x * sin + vec.y * cos)
    },
    /**
     * 
     * @param angle `Degrese Angle`
     * @returns A new `Vec2` With angle pos
     */
    rotate_DegAngle(vec:Vec2,angle:DegAngle):Vec2 {
        const a=Angle.deg2rad(angle)
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        return this.new(vec.x * cos - vec.y * sin, vec.x * sin + vec.y * cos)
    },
    /**
     * @param x `Vec21`
     * @param y `Vec22`
     * @returns A new `Vec2` With distance of `Vec21` and `Vec22`
     */
    distanceSquared(x:Vec2,y:Vec2):number{
        const dx=x.x-y.x
        const dy=x.y-y.y
        return dx*dx+dy*dy
    },
    /**
     * @param x `Vec21`
     * @param y `Vec22`
     * @returns A new `Vec2` With distance squared of `Vec21` and `Vec22`
     */
    distance(x:Vec2,y:Vec2):number{
        const dx=x.x-y.x
        const dy=x.y-y.y
        return Math.sqrt(dx*dx+dy*dy)
    },
    /**
     * @param Vec2 `Vec2`
     * @returns A new `Vec2` With squared of `Vec21`
     */
    squared(Vec:Vec2):number{
        return Vec.x*Vec.x+Vec.y*Vec.y
    },
    dot(x: Vec2, y: Vec2): number {
        return x.x * y.x + x.y * y.y;
    },
    /**
     * @param Vec2 The `Vec2` used in lenght
     * @returns 
     */
    length(Vec2: Vec2): number {
        return Math.sqrt(v2.squared(Vec2))
    },
    
    /**
     * 
     * @param Vec2 `Vec2`
     * @returns A new Absolute `Vec2`
     */
    absolute(Vec2:Vec2):Vec2{
        return this.new(Math.abs(Vec2.x),Math.abs(Vec2.y))
    },
    /**
     * 
     * @param Vec2 `Vec3`
     * @returns A new Interger `Vec3`
     */
    floor(Vec2:Vec2):Vec2{
        return this.new(Math.floor(Vec2.x),Math.floor(Vec2.y))
    },
    /**
     * 
     * @param Vec2 `Vec3`
     * @returns A new Ceil `Vec3`
     */
    ceil(Vec2:Vec2):Vec2{
        return this.new(Math.ceil(Vec2.x),Math.ceil(Vec2.y))
    },
    neg(vec:Vec2):Vec2{
        return this.new(-vec.x,-vec.y)
    },
    /**
     * 
     * @param current The current `Vec2` Position
     * @param end The Final `Vec2` Position
     * @param interpolation 
     * @returns 
     */
    lerp(current: Vec2, end: Vec2,interpolation: number): Vec2 {
        return this.add(v2.scale(current,1-interpolation), this.scale(end,interpolation))
    },
    /**
     * @param Vec2 The `Vec2` to normalize
     * @param fallback A `Vec2` to clone and return in case the normalization operation fails
     * @returns A `Vec2` whose length is 1 and is parallel to the original Vec2
     */
    normalizeSafe(Vec2:Vec2,fallback?:Vec2):Vec2 {
        const eps = 0.000001
        const len = this.length(Vec2)
        fallback??=this.new(1,0)
        return len > eps
            ? {
                x:Vec2.x/len,
                y:Vec2.y/len
            }:this.duplicate(fallback)
    },
    /**
     * @param Vec2 The `Vec2` to normalize
     * @returns A `Vec2` whose length is 1 and is parallel to the original Vec2
     */
    normalize(Vec2:Vec2): Vec2 {
        const eps = 0.000001
        const len = v2.length(Vec2)
        return eps
            ? {
                x:Vec2.x/len,
                y:Vec2.y/len
            }: v2.duplicate(Vec2)
    },
    /**
     * 
     * @param Vec2 The `Vec2` To Duplication
     * @returns The Duplicated Vec2
     */
    duplicate(Vec2:Vec2):Vec2{
        return this.new(Vec2.x,Vec2.y)
    },
    /**
     * 
     * @param Vec2 The `Vec2` To hash
     * @returns Hashed Vec2
     */
    hash(Vec2:Vec2):HashVec2{
        let hash = BigInt(float32ToUint32(Vec2.x))
        hash = (hash * prime1) & BigInt("4294967295")
        hash ^= BigInt(float32ToUint32(Vec2.y))
        hash = (hash * prime2) & BigInt("4294967295")
        return hash
    },
    toString(Vec2:Vec2):string{
        return `{${Vec2.x},${Vec2.y}}`
    }
})
export const NullVec2:Vec2=v2.new(0,0)
export const Angle=Object.freeze({
    deg2rad(angle:DegAngle):RadAngle{
        return angle* Math.PI / 180
    },
    rad2deg(angle:RadAngle):DegAngle {
        return angle * 180 / Math.PI
    },
    random_rotation_modded(mode:RotationMode):RadAngle{
        switch(mode){
            case RotationMode.null:
                return 0
            case RotationMode.limited:
                return random.choose([rotationFull.left,rotationFull.right,rotationFull.bottom,rotationFull.top])
            case RotationMode.full:
                return random.float(-3.141592,3.141592)
        }
    }
})

export const rotationFull={
    right:0,
    left:Angle.deg2rad(-180),
    bottom:Angle.deg2rad(90),
    top:Angle.deg2rad(-90),
}
/**
 * Suaviza um polígono usando Catmull–Rom spline
 * @param polygon - Lista de pontos do polígono (fechado)
 * @param subdivisions - Número de subdivisões por segmento (maior = mais suave)
 */
export function SmoothShape2D(polygon: Vec2[], subdivisions: number = 8): Vec2[] {
    if (polygon.length < 3) return polygon;

    const result: Vec2[] = [];
    const n = polygon.length;

    // Garante que é fechado
    const points = [...polygon, polygon[0], polygon[1], polygon[2]];

    // Catmull–Rom: gera pontos suaves
    for (let i = 0; i < n; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const p2 = points[i + 2];
        const p3 = points[i + 3];

        for (let t = 0; t < subdivisions; t++) {
            const tt = t / subdivisions;
            const tt2 = tt * tt;
            const tt3 = tt2 * tt;

            const x = 0.5 * (
                (2 * p1.x) +
                (-p0.x + p2.x) * tt +
                (2*p0.x - 5*p1.x + 4*p2.x - p3.x) * tt2 +
                (-p0.x + 3*p1.x - 3*p2.x + p3.x) * tt3
            );

            const y = 0.5 * (
                (2 * p1.y) +
                (-p0.y + p2.y) * tt +
                (2*p0.y - 5*p1.y + 4*p2.y - p3.y) * tt2 +
                (-p0.y + 3*p1.y - 3*p2.y + p3.y) * tt3
            );

            result.push(v2.new(x, y));
        }
    }

    return result;
}
