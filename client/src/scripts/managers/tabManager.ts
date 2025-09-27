import { type Game } from "../others/game.ts";

export class TabManager{
    game:Game

    tab=document.querySelector("#tab-view") as HTMLDivElement

    full_tab:boolean=false
    constructor(game:Game){
        this.game=game
    }

    toggle_tab(){
        this.full_tab=!this.full_tab
        if(this.full_tab){
            this.tab.className="tab-view-full"
        }else{
            this.tab.className="tab-view-minimized"
        }
    }
}