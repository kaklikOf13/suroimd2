import { type GameConsole } from "../engine/console.ts";

export class MenuManager{
    save:GameConsole
    content={
        insert_name:document.body.querySelector("#insert-name") as HTMLInputElement
    }
    constructor(save:GameConsole){
        this.save=save
    }
    start(){
        this.content.insert_name.value=this.save.get_variable("cv_loadout_name")
        this.content.insert_name.addEventListener("change",(e)=>{
            this.save.set_variable("cv_loadout_name",this.content.insert_name.value)
        })
    }
}