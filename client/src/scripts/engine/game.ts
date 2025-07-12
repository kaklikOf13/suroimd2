import { BaseGameObject2D, DefaultEvents, DefaultEventsMap2D, Game2D, Particle2D, ParticlesManager2D, Vec2, v2 } from "common/scripts/engine/mod.ts";
import { ResourcesManager, Sprite } from "./resources.ts";
import { KeyListener, MousePosListener } from "./keys.ts";
import { SoundManager } from "./sounds.ts";
import * as PIXI from "pixi.js";
export abstract class ClientGameObject2D extends BaseGameObject2D{
    // deno-lint-ignore no-explicit-any
    declare game:ClientGame2D<any,any>
    container?:PIXI.Container
    constructor(){
        super()
    }
}

export class ClientParticle2D<GameObject extends BaseGameObject2D=BaseGameObject2D> extends Particle2D<GameObject>{
    sprite?:Sprite
    override process_sprite(game:Game2D,sprite: string): void {
        this.sprite=(game as unknown as ClientGame2D).resources.get_sprite(sprite)
    }
}
export class Camera<GameObject extends ClientGameObject2D=ClientGameObject2D,Events extends DefaultEvents = DefaultEvents, EMap extends DefaultEventsMap2D = DefaultEventsMap2D>{
    readonly pixi: PIXI.Application;
    readonly container: PIXI.Container;

    position = v2.new(0, 0);

    private _zoom = 1;
    get zoom(): number { return this._zoom; }
    set zoom(zoom: number) {
        this._zoom = zoom;
        this.resize();
    }

    shaking = false;
    shakeStart!: number;
    shakeDuration!: number;
    shakeIntensity!: number;

    /*readonly shockwaves = new Set<Shockwave>();*/

    width = 1;
    height = 1;

    private static _instantiated = false;
    constructor(readonly game: ClientGame2D<GameObject,Events,EMap>) {
        if (Camera._instantiated) {
            throw new Error("Class 'Camera' has already been instantiated");
        }
        Camera._instantiated = true;

        this.pixi = game.app;
        this.container = new PIXI.Container({
            isRenderGroup: true,
            sortableChildren: true,
            filters: []
        });

        this.zoom=1
    }

    resize(): void {
        const scale=this._zoom

        this.width = this.pixi.screen.width/scale;
        this.height = this.pixi.screen.height/scale;

        /*if (animation) {
            this.zoomTween = this.game.addTween(
                {
                    target: this.container.scale,
                    to: { x: scale, y: scale },
                    duration: 800,
                    ease: EaseFunctions.cubicOut,
                    onComplete: () => {
                        this.zoomTween = undefined;
                    }
                }
            );
        } else {*/
            this.container.scale.set(this._zoom);
        //}
    }

    update(): void {
        const position = this.position;

        /*if (this.shaking) {
            position = v2.add(position, (Vec.create(0, 0), this.shakeIntensity));
            if (Date.now() - this.shakeStart > this.shakeDuration) this.shaking = false;
        }*/

        /*for (const shockwave of this.shockwaves) {
            shockwave.update();
        }*/

        const cameraPos = v2.add(
            v2.scale(position, this._zoom),
            v2.new(-(this.width*this._zoom)/2, -(this.height*this._zoom)/2)
        );

        this.container.position.set(-cameraPos.x, -cameraPos.y);
    }

    shake(duration: number, intensity: number): void {
        this.shaking = true;
        this.shakeStart = Date.now();
        this.shakeDuration = duration;
        this.shakeIntensity = intensity;
    }

    /*shockwave(duration: number, position: Vec2, amplitude: number, wavelength: number, speed: number): void {
        if (!this.game.console.getBuiltInCVar("cv_cooler_graphics")) return;
        this.shockwaves.add(new Shockwave(this.game, duration, position, amplitude, wavelength, speed));
    }*/

    addObject(...objects: PIXI.Container[]): void {
        this.container.addChild(...objects);
    }
}
export class ClientGame2D<GameObject extends ClientGameObject2D=ClientGameObject2D,Events extends DefaultEvents = DefaultEvents, EMap extends DefaultEventsMap2D = DefaultEventsMap2D> extends Game2D<GameObject,Events,EMap>{
    key:KeyListener
    mouse:MousePosListener
    resources:ResourcesManager

    particles:ParticlesManager2D<GameObject>

    camera:Camera<GameObject,Events,EMap>

    sounds:SoundManager
    app:PIXI.Application
    constructor(keyl:KeyListener,mouse:MousePosListener,resources:ResourcesManager,sounds:SoundManager,app:PIXI.Application,objects:Array<new ()=>GameObject>=[]){
        super(60,objects)
        this.sounds=sounds
        this.mouse=mouse
        this.key=keyl
        this.resources=resources
        this.particles=new ParticlesManager2D(this as unknown as Game2D,this.scene.objects)
        this.app=app
        this.particles.particle=ClientParticle2D
        this.camera=new Camera(this)

        this.app.stage.addChild(this.camera.container)
    }
    override on_update(dt:number){
        this.camera.update()
        this.particles.update(dt)
        this.sounds.update(dt)
        this.key.tick()
    }
}