import { PacketsManager } from "../engine/packets.ts";
export { JoinPacket } from "../packets/join_packet.ts";
export { ActionPacket } from "../packets/action_packet.ts";
import { JoinPacket } from "../packets/join_packet.ts";
import { ActionPacket } from "../packets/action_packet.ts";

export const GameConstants={
    player:{
        defaultName:"player",
        playerRadius:0.3,
    },
    loot:{
        velocityDecay:0.96,
        radius:{
            ammo:0.3,
        }
    },
    tps:60,
    collision:{
        threads:2,
        chunckSize:32
    }
}
export enum CATEGORYS{
    PLAYERS="players",
    LOOTS="loots"
}
export const CATEGORYSL=[
    CATEGORYS.PLAYERS,
    CATEGORYS.LOOTS
]

export const PacketManager:PacketsManager=new PacketsManager()
PacketManager.add_packet(JoinPacket)
PacketManager.add_packet(ActionPacket)