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
import { MapPacket } from "../packets/map_packet.ts";

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
            consumible:0.4,
            equipament:0.4,
            skin:0.45
        }
    },
    tps:100,
    collision:{
        threads:2,
        chunckSize:6
    }
}
export enum Layers{
    Normal=10
}
export const LayersL=[
    Layers.Normal
]

export const PacketManager:PacketsManager=new PacketsManager()
PacketManager.add_packet(JoinPacket)
PacketManager.add_packet(ActionPacket)
PacketManager.add_packet(UpdatePacket)
PacketManager.add_packet(GameOverPacket)
PacketManager.add_packet(KillFeedPacket)
PacketManager.add_packet(JoinedPacket)
PacketManager.add_packet(MapPacket)

export enum zIndexes{
    Terrain,
    Grid,
    DeadObstacles,
    Decals,
    DeadCreatures,
    PlayersBody,
    Loots,
    Bullets,
    Obstacles1,
    Obstacles2,
    Rain2,
    Vehicles,
    Creatures,
    Players,
    Particles,
    Obstacles3,
    Obstacles4,
    Explosions,
    ParachutePlayers,
    Rain1,
    Planes,
    DeadZone,
    Lights,
    DamageSplashs,
    Minimap
}
export enum ActionsType{
    Reload,
    Consuming
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
