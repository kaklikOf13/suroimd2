import { OfflineGameServer } from "./offline.ts";
import { OfflineClientsManager } from "common/scripts/engine/mod.ts";
import { PacketManager } from "common/scripts/others/constants.ts";
import { ConfigType } from "common/scripts/config/config.ts";
import { WorkerSocket } from "common/scripts/engine/server_offline/worker_socket.ts";
self.onerror = (e) => {
  console.error("Worker error:", e);
};
self.onmessage = (ev) => {
    const msg = ev.data;
    if (msg.type === "start") {
        const server = new OfflineGameServer(
            new OfflineClientsManager(PacketManager),
            0,
            msg.config as ConfigType
        );
        server.mainloop()

        /*for (let i = 0; i < msg.bots; i++) {
            const bot = server.add_bot()
        }*/

        const ws=new WorkerSocket(self as unknown as Worker)
        server.clients.fake_connect_other_s(ws)
    }
};
