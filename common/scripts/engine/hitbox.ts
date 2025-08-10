import { NullVec2, type Vec2, v2,Collision,OverlapCollision2D, Orientation } from "./geometry.ts"

import { random, SeededRandom } from "./random.ts";
import { NetStream } from "./stream.ts";
import { Numeric } from "./utils.ts";

export enum HitboxType2D{
    null=0,
    circle,
    rect,
    group,
    polygon
}

export interface Hitbox2DMapping {
    [HitboxType2D.null]:NullHitbox2D
    [HitboxType2D.circle]:CircleHitbox2D
    [HitboxType2D.rect]:RectHitbox2D
    [HitboxType2D.group]:HitboxGroup2D
    [HitboxType2D.polygon]:PolygonHitbox2D
}
export type Hitbox2D = Hitbox2DMapping[HitboxType2D]
export abstract class BaseHitbox2D{
    abstract type: HitboxType2D
    abstract collidingWith(other: Hitbox2D):boolean
    abstract overlapCollision(other:Hitbox2D):OverlapCollision2D
    abstract colliding_with_line(a:Vec2,b:Vec2):boolean
    abstract pointInside(point:Vec2):boolean
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
    override colliding_with_line(_a:Vec2,_b:Vec2):boolean{
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
    override colliding_with_line(x:Vec2,y:Vec2):boolean{
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
    override colliding_with_line(a: Vec2, b: Vec2): boolean {
        let tmin = 0;
        let tmax = Number.MAX_VALUE;

        const eps = 1e-8;
        let d = v2.sub(b, a);
        const dist = v2.length(d);

        if (dist < eps) return this.pointInside(a);

        d = v2.normalizeSafe(d);

        if (Math.abs(d.x) < eps) {
            if (a.x < this.min.x || a.x > this.max.x) return false;
        } else {
            const tx1 = (this.min.x - a.x) / d.x;
            const tx2 = (this.max.x - a.x) / d.x;
            tmin = Math.max(tmin, Math.min(tx1, tx2));
            tmax = Math.min(tmax, Math.max(tx1, tx2));
            if (tmin > tmax) return false;
        }

        if (Math.abs(d.y) < eps) {
            if (a.y < this.min.y || a.y > this.max.y) return false;
        } else {
            const ty1 = (this.min.y - a.y) / d.y;
            const ty2 = (this.max.y - a.y) / d.y;
            tmin = Math.max(tmin, Math.min(ty1, ty2));
            tmax = Math.min(tmax, Math.max(ty1, ty2));
            if (tmin > tmax) return false;
        }

        return tmin <= dist && tmax >= 0;
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
    override colliding_with_line(a:Vec2,b:Vec2):boolean{
        return this.hitboxes.some(hitbox => hitbox.colliding_with_line(a,b));
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
    const getVariation = (): number => random.float(-variation, variation);

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
export class PolygonHitbox2D extends BaseHitbox2D {
    override readonly type = HitboxType2D.polygon;
    points: Vec2[];
    position: Vec2;

    constructor(points: Vec2[], center: Vec2 = v2.new(0, 0)) {
        super();
        this.points = points.map(p => v2.duplicate(p));
        this.position = v2.duplicate(center);
    }

    override collidingWith(other: Hitbox2D): boolean {
        switch (other.type) {
            case HitboxType2D.rect: {
                if (this.points.some(p => 
                    p.x >= other.min.x && p.x <= other.max.x &&
                    p.y >= other.min.y && p.y <= other.max.y
                )) return true;

                const rectPoints = [
                    other.min,
                    v2.new(other.max.x, other.min.y),
                    other.max,
                    v2.new(other.min.x, other.max.y)
                ];
                if (rectPoints.some(p => this.pointInside(p))) return true;

                const polyEdges = this.getEdges();
                const rectEdges = [
                    [rectPoints[0], rectPoints[1]],
                    [rectPoints[1], rectPoints[2]],
                    [rectPoints[2], rectPoints[3]],
                    [rectPoints[3], rectPoints[0]]
                ];
                for (const [a1, a2] of polyEdges) {
                    for (const [b1, b2] of rectEdges) {
                        if (Collision.line_intersects_line(a1, a2, b1, b2)) {
                            return true;
                        }
                    }
                }
                return false;
            }
            case HitboxType2D.circle: {
                if (this.points.some(p => v2.distance(p, other.position) <= other.radius))
                    return true;
                if (this.pointInside(other.position)) return true;

                for (const [a, b] of this.getEdges()) {
                    if (Collision.circle_with_line(other.position, other.radius, a, b))
                        return true;
                }
                return false;
            }
            case HitboxType2D.polygon: {
                // Teste ponto-ponto
                if (this.points.some(p => other.pointInside(p))) return true;
                if (other.points.some(p => this.pointInside(p))) return true;

                // Teste aresta-aresta
                for (const [a1, a2] of this.getEdges()) {
                    for (const [b1, b2] of other.getEdges()) {
                        if (Collision.line_intersects_line(a1, a2, b1, b2)) return true;
                    }
                }
                return false;
            }
        }
        return false;
    }

    override overlapCollision(_other: Hitbox2D): OverlapCollision2D {
        return undefined;
    }

    override pointInside(point: Vec2): boolean {
        let inside = false;
        const n = this.points.length;

        for (let i = 0, j = n - 1; i < n; j = i++) {
            const pi = this.points[i];
            const pj = this.points[j];

            // Verifica se o ponto está exatamente sobre a aresta
            if (Collision.point_on_segment(point, pi, pj)) {
                return true; // Considera como "dentro"
            }

            // Ray casting: verifica se a linha horizontal do ponto cruza a aresta
            const intersects = (pi.y > point.y) !== (pj.y > point.y) &&
                point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x;

            if (intersects) inside = !inside;
        }

        return inside;
    }


    override colliding_with_line(a: Vec2, b: Vec2): boolean {
        for (const [p1, p2] of this.getEdges()) {
            if (Collision.line_colliding_with_line(a, b, p1, p2)) return true;
        }
        return false;
    }

    override center(): Vec2 {
        return this.position;
    }

    override scale(scale: number): void {
        for (let i = 0; i < this.points.length; i++) {
            const offset = v2.sub(this.points[i], this.position);
            this.points[i] = v2.add(this.position, v2.scale(offset, scale));
        }
    }

    override randomPoint(): Vec2 {
        const rect = this.toRect();
        let p: Vec2;
        do {
            p = rect.randomPoint();
        } while (!this.pointInside(p));
        return p;
    }

    override toRect(): RectHitbox2D {
        const min = v2.new(Number.MAX_VALUE, Number.MAX_VALUE);
        const max = v2.new(-Number.MAX_VALUE, -Number.MAX_VALUE);
        for (const p of this.points) {
            min.x = Math.min(min.x, p.x);
            min.y = Math.min(min.y, p.y);
            max.x = Math.max(max.x, p.x);
            max.y = Math.max(max.y, p.y);
        }
        return new RectHitbox2D(min, max);
    }

    override transform(position: Vec2 = v2.new(0,0), scale = 1, orientation: Orientation = 0): PolygonHitbox2D {
        const transformed = this.points.map(p => 
            v2.add_with_orientation(position, v2.scale(p, scale), orientation)
        );
        const newCenter = v2.add_with_orientation(position, v2.scale(this.position, scale), orientation);
        return new PolygonHitbox2D(transformed, newCenter);
    }

    override translate(position: Vec2, orientation: Orientation = 0): void {
        const offset = v2.sided(orientation);
        const dx = position.x * offset.x;
        const dy = position.y * offset.y;
        for (let i = 0; i < this.points.length; i++) {
            this.points[i] = v2.add(this.points[i], v2.new(dx, dy));
        }
        this.position = v2.add(this.position, v2.new(dx, dy));
    }

    override clone(): PolygonHitbox2D {
        return new PolygonHitbox2D(this.points, this.position);
    }

    override clamp(min: Vec2, max: Vec2): void {
        const rect = this.toRect();
        const move = v2.clamp2(rect.position, min, max);
        this.translate(move);
    }

    override encode(stream: NetStream): void {
        stream.writeUint16(this.points.length);
        for (const p of this.points) {
            stream.writePosition(p);
        }
        stream.writePosition(this.position);
    }

    static decode(stream: NetStream): PolygonHitbox2D {
        const len = stream.readUint16();
        const pts: Vec2[] = [];
        for (let i = 0; i < len; i++) {
            pts.push(stream.readPosition());
        }
        const center = stream.readPosition();
        return new PolygonHitbox2D(pts, center);
    }

    private getEdges(): [Vec2, Vec2][] {
        const edges: [Vec2, Vec2][] = [];
        for (let i = 0; i < this.points.length; i++) {
            edges.push([this.points[i], this.points[(i + 1) % this.points.length]]);
        }
        return edges;
    }
}
