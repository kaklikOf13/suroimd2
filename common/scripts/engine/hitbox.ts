import { NullVec2, type Vec2, v2,Collision,OverlapCollision2D, Orientation } from "./geometry.ts"

import { random, SeededRandom } from "./random.ts";
import { NetStream } from "./stream.ts";
import { Numeric } from "./utils.ts";

export enum HitboxType2D{
    null=0,
    circle,
    rect,
    group,
}

export interface Hitbox2DMapping {
    [HitboxType2D.circle]:CircleHitbox2D
    [HitboxType2D.rect]:RectHitbox2D
    [HitboxType2D.group]:HitboxGroup2D
    [HitboxType2D.null]:NullHitbox2D
}
export type Hitbox2D = Hitbox2DMapping[HitboxType2D]
export abstract class BaseHitbox2D{
    abstract type: HitboxType2D
    abstract collidingWith(other: Hitbox2D):boolean
    abstract overlapCollision(other:Hitbox2D):OverlapCollision2D
    abstract pointInside(point:Vec2):boolean
    abstract lineInside(x:Vec2,y:Vec2,width:number):boolean
    abstract center():Vec2
    abstract scale(scale:number):void
    abstract randomPoint():Vec2
    abstract toRect():RectHitbox2D
    abstract transform(position?:Vec2,scale?:number,orientation?:Orientation):Hitbox2D
    abstract clone():Hitbox2D
    abstract readonly position:Vec2
    abstract translate(position:Vec2,orientation?:Orientation):void
    abstract clamp(min:Vec2,max:Vec2):void
    abstract encode(stream:NetStream):void

    constructor(){
    }
    is_null():boolean{
        return false
    }
}
export class NullHitbox2D extends BaseHitbox2D{
    position:Vec2
    constructor(position:Vec2){
        super()
        this.position=v2.duplicate(position)
    }
    override readonly type = HitboxType2D.null
    override collidingWith(_other:Hitbox2D):boolean{
        return false
    }
    override pointInside(_point:Vec2):boolean{
        return false
    }
    override overlapCollision(_other: Hitbox2D): OverlapCollision2D {
        return undefined
    }
    override lineInside(_x:Vec2,_y:Vec2,_width:number):boolean{
        return false
    }
    override center(): Vec2 {
        return this.position
    }
    override randomPoint(): Vec2 {
      return this.position
    }
    override toRect():RectHitbox2D{
        return new RectHitbox2D(this.position,v2.new(0,0))
    }
    override scale(_scale: number): void {}
    override is_null():boolean{
        return true
    }

    override transform(position:Vec2=v2.new(0,0),_scale:number=1,orientation:Orientation=0):Hitbox2D{
        return new NullHitbox2D(position?v2.add_with_orientation(this.position,position,orientation):this.position)
    }
    override translate(position: Vec2,orientation:Orientation=0): void {
      this.position=v2.add_with_orientation(this.position,position,orientation)
    }
    override clone():Hitbox2D{
        return new NullHitbox2D(this.position)
    }
    override clamp(min:Vec2,max:Vec2){
        this.position=v2.clamp2(this.position,min,max)
    }
    override encode(stream:NetStream){
        stream.writePosition(this.position)
    }
    static decode(stream:NetStream):NullHitbox2D{
        return new NullHitbox2D(stream.readPosition())
    }
}
export class CircleHitbox2D extends BaseHitbox2D{
    override readonly type = HitboxType2D.circle
    radius:number
    position:Vec2
    constructor(position:Vec2,radius:number){
        super()
        this.position=position
        this.radius=radius
    }
    override collidingWith(other: Hitbox2D): boolean {
        switch(other.type){
            case HitboxType2D.circle:
                return v2.distance(this.position,other.position)<this.radius+other.radius
            case HitboxType2D.rect:
                return Collision.circle_with_rect(this.position,this.radius,other.min,other.max)
        }
        return false
    }
    override overlapCollision(other: Hitbox2D): OverlapCollision2D {
        if(other){
            switch(other.type){
                case HitboxType2D.circle:{
                    const r = this.radius + other.radius;
                    const toP1 = v2.sub(other.position, this.position);
                    const distSqr = v2.squared(toP1);

                    return distSqr < r * r
                        ? {
                            dir: v2.normalizeSafe(toP1),
                            pen: r - Math.sqrt(distSqr)
                        }
                        : undefined
                }case HitboxType2D.rect: {
                    return Collision.circle_with_rect_ov(this.position, this.radius, other.min, other.max);
                }
            }
        }
        return undefined
    }
    override pointInside(point: Vec2): boolean {
      return v2.distance(this.position,point)<this.radius
    }
    override lineInside(x:Vec2,y:Vec2,_width:number):boolean{
        let d = v2.sub(y, x)
        const len = Numeric.max(v2.length(d), 0.000001)
        d = v2.normalizeSafe(d)

        const m = v2.sub(x, this.position)
        const b = v2.dot(m, d)
        const c = v2.dot(m, m) - (this.radius * this.radius)

        if (c > 0 && b > 0) return false

        const discSq = b * b - c
        if (discSq < 0) return false

        const disc = Math.sqrt(discSq);
        const t = -b < disc
            ? disc - b
            : -b - disc;

        if (t <= len) {
            return true
        }

        return false
    }
    override center(): Vec2 {
      return this.position
    }
    override scale(scale: number): void {
      this.radius*=scale
    }
    override randomPoint(): Vec2 {
        const angle = random.float(0,Math.PI*2)
        const length = random.float(0,this.radius)
        return v2.new(this.position.x+(Math.cos(angle)*length),this.position.y+(Math.sin(angle)*length))
    }
    override toRect():RectHitbox2D{
        return RectHitbox2D.positioned(this.position,v2.new(this.radius,this.radius))
    }
    override transform(position?:Vec2,scale?:number,orientation:Orientation=0):CircleHitbox2D{
        const ret=this.clone() as CircleHitbox2D
        if(scale){
            ret.scale(scale)
        }
        if(position){
            const p=v2.mult(position,v2.sided(orientation))
            ret.position.x=p.x
            ret.position.y=p.y
        }
        return ret
    }
    override translate(position: Vec2,orientation:Orientation=0): void {
        const p=v2.mult(position,v2.sided(orientation))
        this.position.x=p.x
        this.position.y=p.y
    }
    override clone():CircleHitbox2D{
        return new CircleHitbox2D(v2.duplicate(this.position),this.radius)
    }
    
    override clamp(min:Vec2,max:Vec2){
        const mm=v2.new(this.radius,this.radius)
        this.position=v2.clamp2(this.position,v2.add(min,mm),v2.sub(max,mm))
    }
    override encode(stream:NetStream){
        stream.writePosition(this.position)
        stream.writeFloat(this.radius,0,500,2)
    }
    static decode(stream:NetStream):CircleHitbox2D{
        return new CircleHitbox2D(stream.readPosition(),stream.readFloat(0,500,2))
    }
}

export class RectHitbox2D extends BaseHitbox2D{
    override readonly type = HitboxType2D.rect
    min:Vec2
    max:Vec2
    constructor(min:Vec2,max:Vec2){
        super()
        this.min=v2.duplicate(min)
        this.max=v2.duplicate(max)
    }
    static positioned(position:Vec2,size:Vec2):RectHitbox2D{
        return new RectHitbox2D(position,v2.add(position,size))
    }
    get position():Vec2{
        return this.min
    }
    override collidingWith(other: Hitbox2D): boolean {
        if(other){
            switch(other.type){
                case HitboxType2D.rect:
                    return (this.max.x>other.min.x&&this.min.x<other.max.x) && (this.max.y>other.min.y&&this.min.y<other.max.y)
                case HitboxType2D.circle:
                    return Collision.circle_with_rect(other.position,other.radius,this.min,this.max)
            }
        }
        return false
    }
    override overlapCollision(other: Hitbox2D): OverlapCollision2D {
        if(other){
            switch(other.type){
                case HitboxType2D.rect:{
                    const ss=v2.dscale(v2.add(v2.sub(this.min,this.max),v2.sub(other.min,other.max)),2)
                    const dist=v2.sub(this.min,other.min)
                    
                    if(v2.less(v2.absolute(dist),ss)){
                        const ov=v2.normalizeSafe(v2.sub(ss,v2.absolute(dist)))
                        const ov2=v2.duplicate(ov)
                        if(ov.x<ov.y){
                            ov2.x=dist.x>0?-ov2.x:ov2.x
                        }else{
                            ov2.y=dist.y>0?-ov2.y:ov2.y
                        }
                        return undefined
                    }
                    break
                }case HitboxType2D.circle: {
                    return Collision.circle_with_rect_ov(other.position,other.radius,this.min,this.max)
                }
            }
        }
        return undefined
    }
    override pointInside(point: Vec2): boolean {
        return (point.x>=this.max.x&&point.x<=this.min.x)&&(point.y>=this.max.y&&point.y<=this.min.y)
    }
    override lineInside(_x:Vec2,_y:Vec2,_width:number):boolean{
        return false
    }
    override center(): Vec2 {
        return v2.add(this.min,v2.dscale(v2.sub(this.min,this.max),2))
    }
    override scale(scale: number): void {
        const centerX = (this.min.x + this.max.x) / 2;
        const centerY = (this.min.y + this.max.y) / 2;

        this.min = v2.new((this.min.x - centerX) * scale + centerX, (this.min.y - centerY) * scale + centerY);
        this.max = v2.new((this.max.x - centerX) * scale + centerX, (this.max.y - centerY) * scale + centerY);
    }
    override randomPoint(): Vec2 {
        return v2.random2(this.min,this.max)
    }
    override toRect():RectHitbox2D{
        return this
    }
    override transform(
        position: Vec2 = v2.new(0, 0),
        scale: number = 1,
        orientation: Orientation = 0
    ): RectHitbox2D {
        const size = v2.sub(this.max, this.min);
        const scaledSize = v2.scale(size, scale);

        let finalSize: Vec2;
        switch (orientation) {
            case 0:
            case 2:
                finalSize = scaledSize;
                break;
            case 1:
            case 3:
                finalSize = v2.new(scaledSize.y, scaledSize.x);
                break;
            default:
                finalSize = scaledSize;
                break;
        }

        const min = v2.duplicate(position);
        const max = v2.add(position, finalSize);

        return new RectHitbox2D(min, max);
    }

    override translate(position: Vec2, orientation: Orientation = 0): void {
        const size = v2.sub(this.max, this.min);

        let finalSize: Vec2;
        switch (orientation) {
            case 0:
            case 2:
                finalSize = size;
                break;
            case 1:
            case 3:
                finalSize = v2.new(size.y, size.x);
                break;
            default:
                finalSize = size;
                break;
        }

        this.min = v2.duplicate(position);
        this.max = v2.add(position, finalSize);
    }
    override clone():RectHitbox2D{
        return new RectHitbox2D(this.min,this.max)
    }
    override encode(stream:NetStream){
        stream.writePosition(this.min)
        stream.writePosition(this.max)
    }
    static decode(stream:NetStream):RectHitbox2D{
        return new RectHitbox2D(stream.readPosition(),stream.readPosition())
    }
    override clamp(min: Vec2, max: Vec2): void {
        this.translate(v2.clamp2(this.position,min,v2.sub(max,v2.sub(this.min,this.max))))
    }
    override is_null(): boolean {
      return false
    }
}
export class HitboxGroup2D extends BaseHitbox2D{
    position:Vec2=v2.new(0,0)
    hitboxes: Hitbox2D[];
    constructor(...hitboxes: Hitbox2D[]) {
        super();
        this.hitboxes = hitboxes;
    }
    override readonly type = HitboxType2D.group
    override collidingWith(that: Hitbox2D): boolean {
        return this.hitboxes.some(hitbox => hitbox.collidingWith(that));
    }
    override pointInside(point:Vec2):boolean{
        for (const hitbox of this.hitboxes) {
            if(hitbox.pointInside(point)) return true;
        }
        return false;
    }
    override overlapCollision(_other: Hitbox2D): OverlapCollision2D {
        return undefined
    }
    override lineInside(_x:Vec2,_y:Vec2,_width:number):boolean{
        return false
    }

    override center(): Vec2 {
        return this.toRect().center();
    }
    override randomPoint(): Vec2 {
        return this.hitboxes[random.int(0,this.hitboxes.length)].randomPoint()
    }
    override toRect():RectHitbox2D{
        const min = v2.new(Number.MAX_VALUE, Number.MAX_VALUE);
        const max = v2.new(0, 0);
        for (const hitbox of this.hitboxes) {
            const toRect = hitbox.toRect();
            min.x = Numeric.min(min.x, toRect.min.x);
            min.y = Numeric.min(min.y, toRect.min.y);
            max.x = Numeric.max(max.x, toRect.max.x);
            max.y = Numeric.max(max.y, toRect.max.y);
        }

        return new RectHitbox2D(min, max);
    }
    override scale(scale: number): void {
        for(const hitbox of this.hitboxes){
            hitbox.scale(scale);
        }
    }
    override is_null():boolean{
        return false
    }
    override transform(position:Vec2=v2.new(0,0),scale?:number,orientation?:Orientation): HitboxGroup2D {
        this.position = position;

        return new HitboxGroup2D(
            ...this.hitboxes.map(hitbox => hitbox.transform(position, scale,orientation))
        );
    }
    override translate(position: Vec2): void {
        for(const hb of this.hitboxes){
            hb.translate(position)
        }
    }
    override clone(deep:boolean=true): HitboxGroup2D {
        return new HitboxGroup2D(...(deep?this.hitboxes.map(hitbox => hitbox.clone(true)):this.hitboxes));
    }
    override clamp(min:Vec2,max:Vec2){
        this.position=v2.clamp2(this.position,min,max)
    }
    override encode(stream:NetStream){
        stream.writePosition(this.position)
    }
    static decode(stream:NetStream):NullHitbox2D{
        return new NullHitbox2D(stream.readPosition())
    }
}
export function jaggedRectangle(
    min: Vec2,
    max: Vec2,
    spacing: number,
    variation: number,
    random: SeededRandom
): Vec2[] {
    const topLeft = v2.duplicate(min);
    const topRight = v2.new(max.x, min.y);
    const bottomRight = v2.duplicate(max);
    const bottomLeft = v2.new(min.x, max.y);

    const points: Vec2[] = [];

    variation = variation / 2;
    const getVariation = (): number => random.get(-variation, variation);

    for (let x = topLeft.x + spacing; x < topRight.x; x += spacing) {
        points.push(v2.new(x, topLeft.y + getVariation()));
    }
    for (let y = topRight.y + spacing; y < bottomRight.y; y += spacing) {
        points.push(v2.new(topRight.x + getVariation(), y));
    }
    for (let x = bottomRight.x - spacing; x > bottomLeft.x; x -= spacing) {
        points.push(v2.new(x, bottomRight.y + getVariation()));
    }
    for (let y = bottomLeft.y - spacing; y > topLeft.y; y -= spacing) {
        points.push(v2.new(bottomLeft.x + getVariation(), y));
    }

    return points;
}