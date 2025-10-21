import { type Player } from "../gameObjects/player.ts";
import { type Game } from "./game.ts";
import { type ServerGameObject } from "./gameObject.ts";
export enum DebugConsoleCommandType{
    Number,
    QueryPlayer,
    PositionOf,

    Kill,
    Give,
    Revive,
}
export type DebugConsoleCommand=({
    type:DebugConsoleCommandType.Number,
    value:number
}|{
    type:DebugConsoleCommandType.QueryPlayer,
    value:string
}|{
    type:DebugConsoleCommandType.PositionOf,
    object:ServerGameObject[]
}|{
    type:DebugConsoleCommandType.Kill|DebugConsoleCommandType.Revive
    player:DebugConsoleCommand
}|{
    type:DebugConsoleCommandType.Give
    player:DebugConsoleCommand
    item:DebugConsoleCommand
    count:DebugConsoleCommand
})
export class DebugConsole{
    game:Game
    constructor(game:Game){
        this.game=game
    }
    /*
        * Val (String) - Use None To Get By Name. # To Get By Id. @ To AccountId
    */
    query_selector_player(val:string):Player[]{
        const ret:Player[]=[]
        const byName=val.charAt(0)
        for(const p of this.game.players){
            if(byName==="@"){
                if(p.username===val.substring(1,val.length)){
                    ret.push(p)
                }
            }else if(byName==="#"){
                if(p.id===parseInt(val.substring(1,val.length))){
                    ret.push(p)
                }
            }else if(p.name===val){
                ret.push(p)
            }
        }
        return ret
    }
}