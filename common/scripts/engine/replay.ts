import { type Game2D } from "./game.ts";
import { ObjectEncoder } from "./gameObject.ts";
import { type NetStream } from "./stream.ts";

export interface RecordedReplay{
    header:{
        version:number
        frame_count:number
    }
    frames:NetStream[]
}
export function WriteRecordedReplayHeader(version:number,frame_count:number):Uint8Array{
    const buf = new ArrayBuffer(14)
    const view = new DataView(buf)
    const enc = new TextEncoder()
    const magic = enc.encode("REPL")
    new Uint8Array(buf).set(magic, 0)
    view.setUint16(4, version, true)
    view.setUint32(10, frame_count, true)

    return new Uint8Array(buf)
}
export function RecordedReplayEncodeFrame(data: ArrayBuffer): Uint8Array {
    const buf = new ArrayBuffer(8 + data.byteLength)
    const view = new DataView(buf)
    view.setUint32(4, data.byteLength, true)

    new Uint8Array(buf, 8).set(new Uint8Array(data))
    return new Uint8Array(buf)
}
export class ReplayRecorder2D{
    game:Game2D
    recording:boolean=false
    encoders:Record<string,ObjectEncoder>

    frames:NetStream[]=[]
    constructor(game:Game2D,encoders:Record<string,ObjectEncoder>){
        this.game=game
        this.game.signals.emit("update",this.update.bind(this))
        this.encoders=encoders
    }
    update(){
        if(this.recording){
            this.frames.push(this.game.scene.objects.encode_all(true,undefined,undefined,true))
        }
    }
    start(){
        this.recording=true
    }
    stop(){
        this.recording=false
    }
}