import { random } from "common/scripts/engine/random.ts";
import { type Player } from "../gameObjects/player.ts";
import { type Game } from "./game.ts";
import { GroupManager, TeamsManager } from "./teams.ts";
import { DamageReason } from "common/scripts/definitions/utils.ts";
import { Vehicle } from "../gameObjects/vehicle.ts";
import { v2 } from "common/scripts/engine/geometry.ts";
import { Vehicles } from "common/scripts/definitions/objects/vehicles.ts";
import { Layers } from "common/scripts/others/constants.ts";

export class GamemodeManager{
    game:Game
    closed:boolean=false
    team_size:number=1
    can_join():boolean{
        return !this.closed&&!this.game.fineshed&&this.game.livingPlayers.length<this.game.config.maxPlayers
    }
    kill_leader?:Player
    battle_plane?:Vehicle
    battle_plane_enabled:boolean=true
    constructor(game:Game){
        this.game=game
        this.team_size=game.config.teamSize
        this.battle_plane_enabled=this.battle_plane_enabled&&game.config.deenable_lobby
    }
    can_down(_player:Player):boolean{
        return false
    }
    call_battle_plane(){
        this.battle_plane=this.game.add_vehicle(v2.new(0,0),Vehicles.getFromString("battle_plane"),Layers.Normal)
        this.closed=true
        this.game.pvpEnabled=true
        this.battle_plane.velocity=v2.new(4,4)
        for(const p of this.game.players){
            p.clear()
            if(!p.dead){
                for(const s of this.battle_plane.seats){
                    if(!s.player){
                        s.set_player(p)
                        break
                    }
                }
            }
        }
    }
    on_start(){
        this.game.interactionsEnabled=true
        if(this.battle_plane_enabled){
            this.call_battle_plane()
        }else{
            this.game.addTimeout(()=>{
                this.closed=true
                this.game.pvpEnabled=true
                console.log(`Game ${this.game.id} Clossed`)
            },50)
        }
    }
    on_finish(){
        this.game.addTimeout(()=>{
            for(const p of this.game.livingPlayers){
                p.send_game_over(true)
            }
            this.game.killing_game=true
            console.log(`Game ${this.game.id} Fineshed`)
        },2)
    }
    startRules():boolean{
        return this.game.livingPlayers.length>1
    }
    on_player_join(_p:Player){
        if(!this.game.started&&this.game.livingPlayers.length>1){
            this.game.addTimeout(this.game.start.bind(this.game),3)
        }
    }
    on_player_die(_p:Player){
        if(this.game.livingPlayers.length<=1){
            this.game.finish()
        }
    }
    is_ally(_a:Player,_b:Player):boolean{
        return false
    }
}
export class TeamsGamemodeManager extends GamemodeManager{
    teamsManager:TeamsManager
    constructor(game:Game){
        super(game)
        this.teamsManager=new TeamsManager()
    }
    override can_down(player:Player):boolean{
        return (player.team&&player.team.get_not_downed_players().length>1)!
    }
    set_team_for_player(p:Player){
        if(p.team===undefined){
            let t=this.teamsManager.get_perfect_team(this.team_size,p.groupId)
            if(!t){
                t=this.teamsManager.add_team()
            }else if(t.players.length>0){
                p.position=random.choose(t.players).position
            }
            t.add_player(p)
        }
    }
    override on_player_join(p:Player){
        this.set_team_for_player(p)
        if(!this.game.started&&this.teamsManager.get_living_teams().length>1){
            this.game.addTimeout(this.game.start.bind(this.game),3)
        }
    }
    override on_player_die(p:Player){
        if(p.team){
            for(const pp of p.team.get_downed_players()){
                pp.kill({amount:pp.health,critical:false,position:pp.position,reason:DamageReason.Bleend,owner:pp.downedBy,source:pp.downedBySource})
            }
        }
        if(this.teamsManager.get_living_teams().length<=1){
            this.game.finish()
        }
    }
    override is_ally(a:Player,b:Player):boolean{
        return a.teamId===b.teamId
    }
}
export class GroupGamemodeManager extends TeamsGamemodeManager{
    groupsManager:GroupManager=new GroupManager()
    f=0
    groups_size:number

    constructor(game:Game,groups_size:number=2){
        super(game)
        this.groups_size=groups_size
        this.team_size=4
    }
    override can_down(player:Player):boolean{
        return super.can_down(player)&&(player.team&&player.team.get_not_downed_players().length>1)!
    }
    override on_player_join(p:Player){
        let g=this.groupsManager.groups[this.f]
        if(!g){
            g=this.groupsManager.add_group()
        }
        g.add_player(p)
        this.f++
        if(this.f>=this.groups_size){
            this.f=0
        }
        super.set_team_for_player(p)
        if(p.team)p.team.group=g.id
        if(!this.game.started&&this.teamsManager.get_living_teams().length>1){
            this.game.addTimeout(this.game.start.bind(this.game),3)
        }
    }
    override on_player_die(p:Player){
        if(p.team){
            for(const pp of p.team.get_downed_players()){
                pp.kill({amount:pp.health,critical:false,position:pp.position,reason:DamageReason.Bleend,owner:pp.downedBy,source:pp.downedBySource})
            }
        }
        if(this.teamsManager.get_living_teams().length<=1){
            this.game.finish()
        }
    }
    override is_ally(a:Player,b:Player):boolean{
        return a.groupId===b.groupId
    }
}