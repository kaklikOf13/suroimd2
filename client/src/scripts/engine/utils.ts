import { Numeric } from "common/scripts/engine/utils.ts";
import { type ClientGame2D } from "./game.ts";

export class Server{
    IP:string
    Port:number
    HTTP:boolean
    constructor(IP:string,Port:number,HTTP:boolean=false){
        this.IP=IP
        this.Port=Port
        this.HTTP=HTTP
    }
    toString():string{
        return `${this.HTTP ? "s" : ""}://${this.IP}:${this.Port}`
    }
}
export interface TweenOptions<T>{
    target: T
    to: Partial<T>
    duration: number
    ease?: (x: number) => number
    yoyo?: boolean
    infinite?: boolean
    onUpdate?: () => void
    onComplete?: () => void
}
export class Tween<T> {
    readonly game: ClientGame2D;

    tick:number=0

    readonly target: T;
    readonly duration: number;

    startValues: Record<string, number> = {};
    endValues: Record<string, number> = {};

    readonly ease: (x: number) => number;

    yoyo: boolean;
    infinite: boolean;

    readonly onUpdate?: () => void;
    readonly onComplete?: () => void;

    constructor(
        game: ClientGame2D,
        config: TweenOptions<T>
    ) {
        this.game = game;
        this.target = config.target;
        for (const key in config.to) {
            this.startValues[key] = config.target[key] as number;
            this.endValues[key] = config.to[key] as number;
        }

        this.duration = config.duration;
        this.ease = config.ease ?? (t => t);
        this.yoyo = config.yoyo ?? false;
        this.infinite = config.infinite ?? false;
        this.onUpdate = config.onUpdate;
        this.onComplete = config.onComplete;
    }

    update(dt:number): void {
        this.tick+=dt

        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        if(this.target.destroyed){
            this.kill();
            this.onComplete?.();
            return
        }

        const interpFactor = Numeric.clamp(this.tick / this.duration, 0, 1);
        for (const key in this.startValues) {
            const startValue = this.startValues[key];
            const endValue = this.endValues[key];

            (this.target[key as keyof T] as number) = Numeric.lerp(startValue, endValue, this.ease(interpFactor));
        }
        this.onUpdate?.();

        if (this.tick>=this.duration) {
            if (this.yoyo) {
                this.yoyo = this.infinite;
                this.tick=0;
                [this.startValues, this.endValues] = [this.endValues, this.startValues];
            } else {
                this.kill();
                this.onComplete?.();
            }
        }
    }

    kill(): void {
        this.game.removeTween(this as unknown as Tween<unknown>);
    }
}
export function HideElement(elem:HTMLElement){
    elem.style.display="none"
    elem.style.pointerEvents="none"
}
export function ShowElement(elem:HTMLElement){
    elem.style.display = ""
    elem.style.pointerEvents = ""
}
export function ToggleElement(elem:HTMLElement){
    if(elem.style.display==="none")ShowElement(elem)
    else HideElement(elem)
}