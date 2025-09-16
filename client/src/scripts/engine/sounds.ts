import { v2, Vec2 } from "common/scripts/engine/geometry.ts";
import { type Sound } from "./resources.ts";

export interface SoundOptions {
    volume:number
    loop:boolean
    delay:number
    offset:number
    position:Vec2
    max_distance:number
    rolloffFactor:number
    on_complete?:()=>void
}
export enum SoundPlayState{
    playFinished,
    playSucceeded,
    playInterrupted
}
const SoundsMaxInstances = 300;
export class SoundInstance{
    manager:SoundManager
    buffer: AudioBuffer | null = null;

    volume:number=1
    volumeOld!: number

    delay:number=0

    pan = 0
    panOld!: number

    sourceNode: AudioBufferSourceNode | null = null

    on_complete?:()=>void

    playState:SoundPlayState=SoundPlayState.playFinished
    stopping:boolean=false
    stopTime = 0

    gainNode!: GainNode
    pannerNode!: PannerNode
    destination: GainNode | null = null;
    paramEvents = 0;

    
    position?: Vec2;
    maxDistance = 20;
    rolloffFactor = 1.0;

    ctx:AudioContext
    constructor(manager:SoundManager,ctx:AudioContext){
        this.volumeOld=this.volume
        this.manager=manager
        this.ctx=ctx

        this.gainNode = this.ctx.createGain();
        this.pannerNode = this.ctx.createPanner();

        this.pannerNode.panningModel = "equalpower";
        this.pannerNode.distanceModel = "inverse";
        this.pannerNode.refDistance = 1;
        this.pannerNode.maxDistance = this.maxDistance;
        this.pannerNode.rolloffFactor = this.rolloffFactor;

        this.gainNode.connect(this.pannerNode);
    }

    start(destination: GainNode, buffer: AudioBuffer, volume: number, loop: boolean, delay: number, offset: number, position?: Vec2,rolloffFactor?:number,max_distance?:number) {
        this.volumeOld = this.volume = volume;
        this.stopping = false;
        this.position = position;
        this.rolloffFactor=rolloffFactor??1.0
        this.maxDistance=max_distance??20

        this.destination = destination;
        this.sourceNode = this.ctx.createBufferSource();
        this.sourceNode.buffer = buffer;
        this.buffer = buffer;
        this.sourceNode.loop = loop;

        this.sourceNode.connect(this.gainNode);
        this.pannerNode.connect(this.destination);

        this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);

        if (this.position) {
            this.pannerNode.positionX.setValueAtTime(this.position.x, this.ctx.currentTime);
            this.pannerNode.positionY.setValueAtTime(0, this.ctx.currentTime);
            this.pannerNode.positionZ.setValueAtTime(this.position.y, this.ctx.currentTime);
        } else {
            this.pannerNode.positionX.setValueAtTime(0, this.ctx.currentTime);
            this.pannerNode.positionY.setValueAtTime(0, this.ctx.currentTime);
            this.pannerNode.positionZ.setValueAtTime(0, this.ctx.currentTime);
        }

        this.sourceNode.start(this.ctx.currentTime + delay, offset);

        this.playState = SoundPlayState.playSucceeded;

        this.stopTime = loop
            ? 1.0e100
            : this.ctx.currentTime + delay + buffer.duration - offset;
    }
    updateListenerPosition(listenerPos: Vec2) {
        if (!this.position) return;

        const relX = this.position.x - listenerPos.x;
        const relY = this.position.y - listenerPos.y;

        this.pannerNode.positionX.setValueAtTime(relX, this.ctx.currentTime);
        this.pannerNode.positionZ.setValueAtTime(relY, this.ctx.currentTime);
    }
    setGain(gain: number) {
        if (this.stopping) {
            return;
        }
        this.gainNode.gain.setTargetAtTime(gain, this.ctx.currentTime, 0.02)
        ++this.paramEvents
    }
    stop(){
        if(this.stopping)return
        this.setGain(0.0)
        this.stopTime=this.ctx.currentTime+0.1
        this.stopping=true
        this.playState=SoundPlayState.playInterrupted
    }
    disconnect(){
        if(this.playState===SoundPlayState.playFinished)return
        if(this.on_complete)this.on_complete()
        this.manager.soundInstances.splice(this.manager.soundInstances.indexOf(this),1)

        this.sourceNode?.stop(0)
        this.playState=SoundPlayState.playFinished
    }
}
export class ManipulativeSoundInstance{
    volume_id:string=""
    instance:SoundInstance|null
    manager:SoundManager
    constructor(volume_id:string="",manager:SoundManager){
        this.instance=null
        this.volume_id=volume_id
        this.manager=manager
    }
    get running():boolean{
        return (this.instance&&this.instance.playState==SoundPlayState.playSucceeded) as boolean
    }
    set(sound:Sound|null|undefined,loop:boolean=false){
        if(sound){
            if(this.instance){
                this.instance.stop()
            }else{
                this.instance=new SoundInstance(this.manager,this.manager.ctx)
            }
            let volume = sound.volume*this.manager.masterVolume*(this.manager.volumes[this.volume_id]===undefined?1:this.manager.volumes[this.volume_id])
            volume = this.manager.mute ? 0 : volume
            this.instance.start(this.manager.masterGainNode,sound.buffer,volume,loop,0,0)
        }else{
            if(this.instance){
                this.instance.stop()
            }
            this.instance=null
        }
    }
}
export class SoundManager{
    ctx:AudioContext=new self.AudioContext()
    mute = false
    muteOld=false
    masterVolume=1
    masterVolumeOld=1
    volumes:Record<string,number>={}
    soundInstances: SoundInstance[]=[]
    playingInstances: SoundInstance[]=[]
    instanceId = 0;

    listener_position:Vec2=v2.new(0,0)

    masterGainNode!: GainNode
    compressorNode!: DynamicsCompressorNode
    constructor(){
        // deno-lint-ignore ban-ts-comment
        // @ts-expect-error
        self.audioEngine=this
        for (let i = 0; i < SoundsMaxInstances; i++) {
            const instance = new SoundInstance(this,this.ctx)
            this.soundInstances.push(instance)
        }

        this.masterGainNode = this.ctx.createGain()
        this.compressorNode = this.ctx.createDynamicsCompressor()
        this.masterGainNode.connect(this.compressorNode)
        this.compressorNode.connect(this.ctx.destination)
    }
    play(sound: Sound, params: Partial<SoundOptions>, volume_group?: string): SoundInstance | undefined {
        if (!sound) return;

        let volume = params.volume != undefined ? params.volume : 1;
        volume *= sound.volume * this.masterVolume;
        volume *= (volume_group && this.volumes[volume_group] !== undefined) ? this.volumes[volume_group] : 1;
        volume = this.mute ? 0 : volume;

        const loop = !!params.loop;
        const delay = params.delay ? params.delay * 0.001 : 0;
        const offset = params.offset ? params.offset : 0;

        for (let _i = 0; _i < SoundsMaxInstances; _i++) {
            ++this.instanceId;
            if (!this.soundInstances[this.instanceId % SoundsMaxInstances] || !this.soundInstances[this.instanceId % SoundsMaxInstances].buffer) {
                break;
            }
        }

        if (!this.soundInstances[this.instanceId % SoundsMaxInstances]) {
            this.soundInstances[this.instanceId % SoundsMaxInstances] = new SoundInstance(this, this.ctx);
        }

        const instance = this.soundInstances[this.instanceId % SoundsMaxInstances];
        instance.on_complete = params.on_complete;
        instance.start(
            this.masterGainNode,
            sound.buffer,
            volume,
            loop,
            delay,
            offset,
            params.position,
            params.rolloffFactor,
            params.max_distance
        );

        if (!this.playingInstances.includes(instance)) {
            this.playingInstances.push(instance);
        }

        return instance;
    }

    update(_dt: number) {
        const masterVolume = this.mute ? 0 : this.masterVolume;
        const masterVolumeOld = this.muteOld ? 0 : this.masterVolumeOld;
        this.masterVolumeOld = this.masterVolume;
        this.muteOld = this.mute;

        if (masterVolume != masterVolumeOld) {
            this.masterGainNode.gain.setTargetAtTime(masterVolume, this.ctx.currentTime, 0.02);
        }

        for (let i = this.playingInstances.length - 1; i >= 0; i--) {
            const instance = this.playingInstances[i];

            if (instance.volumeOld != instance.volume) {
                instance.volumeOld = instance.volume;
            }

            instance.updateListenerPosition(this.listener_position);

            if (instance.ctx) {
                if (this.ctx.currentTime > instance.stopTime) {
                    instance.disconnect();
                }
            }

            if (!instance.buffer) {
                this.playingInstances.splice(i, 1);
            }
        }
    }
}