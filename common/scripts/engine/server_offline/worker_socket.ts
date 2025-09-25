import { BasicSocket } from "./offline_server.ts";

export class WorkerSocket extends BasicSocket {
    private port: Worker

    constructor(port: Worker) {
        super();
        this.port = port;

        this.port.addEventListener("message", (ev: MessageEvent) => {
            if (this.onmessage) {
                this.onmessage(ev);
            }
        });

        this.send=(data)=>{
            try {
                this.port.postMessage(data, [data as ArrayBuffer]); 
            } catch {
                this.port.postMessage(data);
            }
        }
        this.close=(code,reason)=>{
            this.readyState = this.CLOSED;
            if (this.onclose) this.onclose(code, reason);

            if (this.port instanceof Worker) {
                this.port.terminate();
            }
        }

        this.readyState = this.OPEN;
        if (this.onopen) this.onopen();
    }
}
