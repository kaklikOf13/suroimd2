import { type Sound } from "./resources.ts";

export interface SoundOptions {
    volume:number
    loop:boolean
    delay:number
    offset:number
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

    pan = 0
    panOld!: number

    sourceNode: AudioBufferSourceNode | null = null

    playState:SoundPlayState=SoundPlayState.playFinished
    stopping:boolean=false
    stopTime = 0

    gainNode!: GainNode
    pannerNode!: PannerNode
    destination: GainNode | null = null;
    paramEvents = 0;

    ctx:AudioContext
    constructor(manager:SoundManager,ctx:AudioContext){
        this.volumeOld=this.volume
        this.manager=manager
        this.ctx=ctx

        this.gainNode = this.ctx.createGain();
        this.pannerNode = this.ctx.createPanner();
        this.pannerNode.panningModel = "equalpower";
        this.gainNode.connect(this.pannerNode);
    }

    start(destination: GainNode,buffer: AudioBuffer,volume:number,loop:boolean,delay:number,offset:number){
        this.volumeOld=this.volume=volume
        this.stopping=false

        this.destination = destination;
        this.sourceNode=this.ctx.createBufferSource()
        this.sourceNode.buffer=buffer
        this.buffer=buffer
        this.sourceNode.loop=loop
        this.sourceNode.connect(this.gainNode);
        this.pannerNode.connect(this.destination);
        this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
        ++this.paramEvents;

        this.sourceNode.start(this.ctx.currentTime+delay,offset)

        this.playState=SoundPlayState.playSucceeded

        this.stopTime = loop
            ? 1.0e100
            : this.ctx.currentTime + delay + buffer.duration - offset;
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
        this.manager.soundInstances.splice(this.manager.soundInstances.indexOf(this),1)

        this.sourceNode?.stop(0)
        this.playState=SoundPlayState.playFinished
    }
}
export class SoundManager{
    ctx:AudioContext=new self.AudioContext()
    mute = false
    muteOld=false
    masterVolume=1
    masterVolumeOld=1
    musicVolume=1
    volumes:Record<string,number>={}
    soundInstances: SoundInstance[]=[]
    playingInstances: SoundInstance[]=[]
    instanceId = 0;

    masterGainNode!: GainNode
    compressorNode!: DynamicsCompressorNode

    music:SoundInstance|null=null
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
    set_music(sound:Sound|null,loop:boolean=false){
        if(sound){
            if(this.music){
                this.music.stop()
            }else{
                this.music=new SoundInstance(this,this.ctx)
            }
            let volume = sound.volume*this.masterVolume*this.musicVolume
            volume = this.mute ? 0 : volume
            this.music.start(this.masterGainNode,sound.buffer,volume,loop,0,0)
        }else{
            if(this.music){
                this.music.stop()
            }
            this.music=null
        }

    }
    play(sound:Sound,params:Partial<SoundOptions>){
        let volume = params.volume != undefined ? params.volume : 1
        volume *= sound.volume*this.masterVolume
        volume = this.mute ? 0 : volume
        const loop = !!params.loop
        const delay = params.delay ? params.delay * 0.001 : 0
        const offset = params.offset ? params.offset : 0
        for (let _i = 0; _i < SoundsMaxInstances; _i++) {
            ++this.instanceId;
            if (!this.soundInstances[this.instanceId % SoundsMaxInstances].buffer) {
                break;
            }
        }
        const instance=this.soundInstances[this.instanceId % SoundsMaxInstances]
        instance.start(this.masterGainNode,sound.buffer,volume,loop,delay,offset)
        if (!this.playingInstances.includes(instance)) {
            this.playingInstances.push(instance)
        }
    }
    update(_dt:number){
        const masterVolume = this.mute ? 0 : this.masterVolume
        const masterVolumeOld = this.muteOld ? 0 : this.masterVolumeOld;
        this.masterVolumeOld = this.masterVolume;
        this.muteOld = this.mute;
        if (masterVolume != masterVolumeOld) {
            this.masterGainNode.gain.setTargetAtTime(
                masterVolume,
                this.ctx.currentTime,
                0.02,
            );
        }
        for (let i = this.playingInstances.length - 1; i >= 0; i--) {
            const instance = this.playingInstances[i]

            if (instance.volumeOld != instance.volume) {
                instance.volumeOld = instance.volume
                //instance.setGain(instance.volume)
            }

            if (instance.ctx) {
                if (this.ctx.currentTime > instance.stopTime) {
                    instance.disconnect()
                }
            }

            if (!instance.buffer) {
                this.playingInstances.splice(i, 1)
            }
        }
    }
}