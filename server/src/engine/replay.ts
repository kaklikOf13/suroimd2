import {RecordedReplayEncodeFrame, ReplayRecorder2D, WriteRecordedReplayHeader} from "common/scripts/engine/replay.ts"
export class ServerReplayRecorder2D extends ReplayRecorder2D{
    async save_replay(path: string){
        const file = await Deno.open(path, { write: true, create: true, truncate: true })
        await file.write(WriteRecordedReplayHeader(1,this.frames.length))
        for (const f of this.frames) {
            await file.write(RecordedReplayEncodeFrame(f.buffer as ArrayBuffer))
        }
        file.close()
    }
}