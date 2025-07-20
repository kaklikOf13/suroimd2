import { PacketsManager } from "../engine/packets.ts"
export { JoinPacket } from "../packets/join_packet.ts"
export { ActionPacket } from "../packets/action_packet.ts"
export { GameOverPacket } from "../packets/gameOver.ts"
import { JoinPacket } from "../packets/join_packet.ts"
import { ActionPacket } from "../packets/action_packet.ts"
import { GameOverPacket } from "../packets/gameOver.ts"
import { UpdatePacket } from "../packets/update_packet.ts";
import { KillFeedPacket } from "../packets/killfeed_packet.ts";
import { JoinedPacket } from "../packets/joined_packet.ts";

export const GameConstants={
    player:{
        defaultName:"Player",
        playerRadius:0.4,
        max_name_size:25,
    },
    loot:{
        velocityDecay:0.97,
        radius:{
            ammo:0.38,
            gun:0.54,
            equipament:0.4,
        }
    },
    tps:100,
    collision:{
        threads:2,
        chunckSize:8
    }
}
export enum CATEGORYS{
    PLAYERS=0,
    LOOTS,
    BULLETS,
    OBSTACLES,
    EXPLOSIONS,
    PROJECTILES,
    DECALS,
    PLAYERS_BODY
}
export const CATEGORYSL=[
    CATEGORYS.PLAYERS,
    CATEGORYS.LOOTS,
    CATEGORYS.BULLETS,
    CATEGORYS.OBSTACLES,
    CATEGORYS.EXPLOSIONS,
    CATEGORYS.PROJECTILES,
    CATEGORYS.DECALS,
    CATEGORYS.PLAYERS_BODY,
]

export const PacketManager:PacketsManager=new PacketsManager()
PacketManager.add_packet(JoinPacket)
PacketManager.add_packet(ActionPacket)
PacketManager.add_packet(UpdatePacket)
PacketManager.add_packet(GameOverPacket)
PacketManager.add_packet(KillFeedPacket)
PacketManager.add_packet(JoinedPacket)

export enum zIndexes{
    Terrain,
    Grid,
    DeadObstacles,
    Decals,
    PlayersBody,
    Loots,
    Bullets,
    Obstacles1,
    Obstacles2,
    Players,
    Particles,
    Obstacles3,
    Obstacles4,
    Explosions,
    DamageSplashs
}
export enum ActionsType{
    Reload,
    Healing
}

export type PlayerModifiers={
    damage:number
    speed:number
    health:number
    boost:number
    bullet_speed:number
    bullet_size:number
    critical_mult:number
    luck:number
    mana_consume:number
}