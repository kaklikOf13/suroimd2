import { OfflineGameServer } from "./offline.ts";
import { OfflineClientsManager, random } from "common/scripts/engine/mod.ts";
import { PacketManager } from "common/scripts/others/constants.ts";
import { ConfigType } from "common/scripts/config/config.ts";
import { WorkerSocket } from "common/scripts/engine/server_offline/worker_socket.ts";
import { SimpleBotAi } from "../../../../server/src/game_server/player/simple_bot_ai.ts";
import { Backpacks } from "common/scripts/definitions/items/backpacks.ts";
import { Armors } from "common/scripts/definitions/items/equipaments.ts";
import { Consumibles } from "common/scripts/definitions/items/consumibles.ts";
import { type GameItem } from "common/scripts/definitions/utils.ts";
import { Melees } from "common/scripts/definitions/items/melees.ts";
import { Boosts, BoostType } from "common/scripts/definitions/player/boosts.ts";
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
        server.mainloop(true)

        for (let i = 0; i < msg.bots; i++) {
            const bot = server.add_bot()
            const ai=new SimpleBotAi()
            bot.ai=ai
            bot.inventory.set_backpack(Backpacks.getFromString("tactical_pack"))
            bot.inventory.ammos["556mm"]=random.choose([0,100,200,300])
            bot.inventory.ammos["762mm"]=random.choose([0,100,200,300])
            bot.inventory.ammos["9mm"]=random.choose([0,100,200,300])
            bot.inventory.ammos["12g"]=random.choose([0,15,30,60,90])
            if(Math.random()<=0.5){
                bot.inventory.set_weapon(0,Melees.getFromString(random.choose(["hammer","axe"])))
            }
            //bot.vest=Armors.getFromString(random.choose(["basic_vest","regular_vest","tactical_vest"]))
            //bot.vest=Armors.getFromString("regular_vest")
            bot.vest=Armors.getFromString("tactical_vest")
            bot.helmet=Armors.getFromString(random.choose(["basic_helmet","regular_helmet","tactical_helmet"]))
            bot.inventory.give_item(Consumibles.getFromString("medikit") as unknown as GameItem,10)
            bot.inventory.give_item(Consumibles.getFromString("yellow_pills") as unknown as GameItem,4)
            bot.inventory.give_item(Consumibles.getFromString("red_pills") as unknown as GameItem,4)
            bot.inventory.give_item(Consumibles.getFromString("blue_pills") as unknown as GameItem,4)
            bot.inventory.give_item(Consumibles.getFromString("purple_pills") as unknown as GameItem,4)

            if(Math.random()<=0.5){
                bot.boost_def=Boosts[BoostType.Shield]
                bot.boost=100
            }
        }

        const ws=new WorkerSocket(self as unknown as Worker)
        server.clients.fake_connect_other_s(ws)
    }
};
