import { NullVec2, type Vec2, v2 } from "./geometry.ts"
import { random } from "./random.ts";

export const Collision=Object.freeze({
    circle_with_rect(hb1:CircleHitbox2D,hb2:RectHitbox2D):boolean{
        const cp=v2.clamp2(hb1.position,hb2.position,v2.add(hb2.position,hb2.size))
        const dist=v2.distance(hb1.position,cp)
        return (dist<hb1.radius*hb1.radius)||((hb1.position.x>=hb2.position.x&&hb1.position.x<=hb2.position.x+hb2.size.x)&&(hb1.position.x>=hb2.position.x&&hb1.position.x<=hb2.position.x+hb2.size.x))
    },
    circle_with_rect_ov(hb1:CircleHitbox2D,hb2:RectHitbox2D){
        if ((hb2.position.x <= hb1.position.x && hb1.position.x <= hb2.position.x+hb2.size.x) && (hb2.position.y <= hb1.position.y && hb1.position.y <= hb2.position.y+hb2.size.y)) {

            const halfDim = v2.dscale(v2.sub(v2.add(hb2.position,hb2.size), hb2.position), 2)
            const p=v2.sub(hb1.position, v2.add(hb2.position, halfDim))
            const p2=v2.sub(v2.sub(v2.absolute(p),halfDim),v2.new(hb1.radius,hb1.radius))
            return [v2.new(p.x > 0 ? 1 : -1,p.y > 0 ? 1 : -1),p2.x]
        }

        const dir = v2.sub(v2.clamp2(hb1.position,hb2.position,v2.add(hb2.position,hb2.size)),hb1.position)
        const dstSqr = v2.squared(dir)

        if (dstSqr < hb1.radius * hb1.radius) {
            const dst = Math.sqrt(dstSqr)
            return [v2.normalizeSafe(dir),(hb1.radius - dst)]
        }
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
    abstract center():Vec2
    abstract scale(scale:number):void
    abstract randomPoint():Vec2
    abstract toRect():RectHitbox2D
    abstract transform(position?:Vec2,scale?:number):Hitbox2D
    abstract clone():Hitbox2D
    position:Vec2
    constructor(position:Vec2){
        this.position=position
    }
    is_null():boolean{
        return false
    }
}
export class NullHitbox2D extends BaseHitbox2D{
    constructor(){
        super(NullVec2)
    }
    override readonly type = HitboxType2D.null
    override collidingWith(_other:Hitbox2D):boolean{
        return false
    }
    override pointInside(_point:Vec2):boolean{
        return false
    }
    override overlapCollision(_other: Hitbox2D): OverlapCollision2D {
        return {overlap:NullVec2,collided:false}
    }
    override center(): Vec2 {
        return NullVec2
    }
    override randomPoint(): Vec2 {
      return NullVec2
    }
    override toRect():RectHitbox2D{
        return new RectHitbox2D(this.position,v2.new(0,0))
    }
    override scale(_scale: number): void {}
    override is_null():boolean{
        return true
    }

    override transform(_position?:Vec2,_scale?:number):Hitbox2D{
        return new NullHitbox2D()
    }
    override clone():Hitbox2D{
        return new NullHitbox2D()
    }
}
export interface OverlapCollision2D{
    overlap:Vec2
    collided:boolean
}
export class CircleHitbox2D extends BaseHitbox2D{
    override readonly type = HitboxType2D.circle
    radius:number
    constructor(position:Vec2,radius:number){
        super(position)
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
                    const dist = v2.distance(this.position,other.position)
                    const dis=v2.sub(this.position,other.position)
                    if(dist<0.0001){
                        return {overlap:v2.new(1,1),collided:true}
                    }
                    const sr=(this.radius + other.radius)
                    if (dist < sr){
                        return {overlap:v2.scale(v2.dscale(dis,dist),-((sr/2)*(1-dist))),collided:true}
                    }
                    break
                }case HitboxType2D.rect: {
                    const result = Collision.circle_with_rect_ov(this,other)
                    if (result) {
                        const pos=v2.normalizeSafe(v2.scale(result[0] as Vec2, (result[1] as number)*2))
                        if(v2.is(pos,NullVec2)){
                            break
                        }
                        return {overlap:pos,collided:true}
                    }
                    break
                }
            }
        }
        return {overlap:NullVec2,collided:false}
    }
    override pointInside(point: Vec2): boolean {
      return v2.distance(this.position,point)<this.radius
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
    override transform(position?:Vec2,scale?:number):Hitbox2D{
        const ret=this.clone()
        if(position){
            ret.position.x+=position.x
            ret.position.y+=position.y
        }
        if(scale){
            ret.scale(scale)
        }
        return ret
    }
    override clone():Hitbox2D{
        return new CircleHitbox2D(v2.duplicate(this.position),this.radius)
    }
}

export class RectHitbox2D extends BaseHitbox2D{
    override readonly type = HitboxType2D.rect
    size:Vec2
    constructor(position:Vec2,size:Vec2){
        super(position)
        this.size=size
    }
    override collidingWith(other: Hitbox2D): boolean {
        if(other){
            switch(other.type){
                case HitboxType2D.rect:
                    return (this.position.x+this.size.x>other.position.x&&this.position.x<other.position.x+other.size.x) && (this.position.y+this.size.y>other.position.y&&this.position.y<other.position.y+other.size.y)
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
                    const ss=v2.dscale(v2.add(this.size,other.size),2)
                    const dist=v2.sub(this.position,other.position)
                    
                    if(v2.less(v2.absolute(dist),ss)){
                        const ov=v2.normalizeSafe(v2.sub(ss,v2.absolute(dist)))
                        const ov2=v2.duplicate(ov)
                        if(ov.x<ov.y){
                            ov2.x=dist.x>0?-ov2.x:ov2.x
                        }else{
                            ov2.y=dist.y>0?-ov2.y:ov2.y
                        }
                        return {overlap:ov2,collided:!v2.is(ov2,NullVec2)}
                    }
                    break
                }case HitboxType2D.circle: {
                    const result = Collision.circle_with_rect_ov(other,this)
                    if (result) {
                        const pos=v2.normalizeSafe(v2.scale(result[0] as Vec2, (result[1] as number)*-2))
                        if(v2.is(pos,NullVec2)){
                            break
                        }
                        return {overlap:pos,collided:true}
                    }
                    break
                }
            }
        }
        return {overlap:NullVec2,collided:false}
    }
    override pointInside(point: Vec2): boolean {
        return (this.position.x+this.size.x>=point.x&&this.position.x<=point.x)&&(this.position.y+this.size.y>=point.y&&this.position.y<=point.y)
    }
    override center(): Vec2 {
        return v2.add(this.position,v2.dscale(this.size,2))
    }
    override scale(scale:number){
        this.size=v2.scale(this.size,scale)
    }
    override randomPoint(): Vec2 {
        return v2.add(this.position,v2.random2(NullVec2,this.size))
    }
    override toRect():RectHitbox2D{
        return this
    }
    override transform(position?:Vec2,scale?:number):Hitbox2D{
        const ret=this.clone()
        if(position){
            ret.position.x+=position.x
            ret.position.y+=position.y
        }
        if(scale){
            ret.scale(scale)
        }
        return ret
    }
    override clone():Hitbox2D{
        return new RectHitbox2D(v2.duplicate(this.position),v2.duplicate(this.size))
    }
}