import { NullVec2, type Vec2, v2 } from "./geometry.ts"
import { random } from "./random.ts";
import { Numeric } from "./utils.ts";

export const Collision=Object.freeze({
    circle_with_rect(hb1:CircleHitbox2D,hb2:RectHitbox2D):boolean{
        const cp=v2.clamp2(hb1.position,hb2.min,hb2.max)
        const dist=v2.distance(hb1.position,cp)
        return (dist<hb1.radius*hb1.radius)||((hb1.position.x>=hb2.min.x&&hb1.position.x<=hb2.max.x)&&(hb1.position.y>=hb2.position.y&&hb1.position.y<=hb2.max.y))
    },
    circle_with_rect_ov(_hb1:CircleHitbox2D,_hb2:RectHitbox2D){
        return null
    },
})

export enum HitboxType2D{
    circle=0,
    rect=1,
    null=2,
    //group,
}

export interface Hitbox2DMapping {
    [HitboxType2D.circle]:CircleHitbox2D
    [HitboxType2D.rect]:RectHitbox2D
    //[HitboxType2D.group]:HitboxGroup
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
    abstract transform(position?:Vec2,scale?:number):Hitbox2D
    abstract clone():Hitbox2D
    abstract readonly position:Vec2
    abstract translate(position:Vec2):void
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

    override transform(position?:Vec2,_scale?:number):Hitbox2D{
        return new NullHitbox2D(position?v2.add(this.position,position):this.position)
    }
    override translate(position: Vec2): void {
      this.position.x=position.x
      this.position.y=position.y
    }
    override clone():Hitbox2D{
        return new NullHitbox2D(this.position)
    }
}
export type OverlapCollision2D={
    dir:Vec2
    pen:number
}|undefined|null
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
                return Collision.circle_with_rect(this,other)
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
                    const result = Collision.circle_with_rect_ov(this,other)
                    if (result) {
                        const pos=v2.normalizeSafe(v2.scale(result[0] as Vec2, (result[1] as number)*2))
                        if(v2.is(pos,NullVec2)){
                            break
                        }
                        return undefined
                    }
                    break
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
        return new RectHitbox2D(this.position,v2.new(this.radius,this.radius))
    }
    override transform(position?:Vec2,scale?:number):CircleHitbox2D{
        const ret=this.clone() as CircleHitbox2D
        if(scale){
            ret.scale(scale)
        }
        if(position){
            ret.position.x+=position.x
            ret.position.y+=position.y
        }
        return ret
    }
    override translate(position: Vec2): void {
        this.position.x=position.x
        this.position.y=position.y
    }
    override clone():CircleHitbox2D{
        return new CircleHitbox2D(v2.duplicate(this.position),this.radius)
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
                    return Collision.circle_with_rect(other,this)
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
                    const result = Collision.circle_with_rect_ov(other,this)
                    if (result) {
                        const pos=v2.normalizeSafe(v2.scale(result[0] as Vec2, (result[1] as number)*-2))
                        if(v2.is(pos,NullVec2)){
                            break
                        }
                        return undefined
                    }
                    break
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
    override transform(position?:Vec2,scale?:number):RectHitbox2D{
        const ret=this.clone()
        if(scale){
            ret.scale(scale)
        }
        if(position){
            ret.translate(position)
        }
        return ret
    }
    translate(position: Vec2): void {
        const size=v2.sub(this.max,this.min)
        this.min.x=position.x
        this.min.y=position.y
        this.max.x=position.x+size.x
        this.max.y=position.y+size.y
    }
    override clone():RectHitbox2D{
        return new RectHitbox2D(this.min,this.max)
    }
}