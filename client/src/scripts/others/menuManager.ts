import { type GameConsole } from "../engine/console.ts";

export class MenuManager{
    save:GameConsole
    content={
        insert_name:document.body.querySelector("#insert-name") as HTMLInputElement,

        btn_settings:document.body.querySelector("#btn-settings") as HTMLButtonElement,

        settings_tabs:document.body.querySelector("#settings-tabs") as HTMLDivElement,
        settings:{
            graphics_textures:document.body.querySelector("#settings-graphics-texture") as HTMLSelectElement,
            graphics_particles:document.body.querySelector("#settings-graphics-particles") as HTMLSelectElement
        }
    }
    constructor(save:GameConsole){
        this.save=save
    }
    start(){
        this.content.insert_name.value=this.save.get_variable("cv_loadout_name")
        this.content.insert_name.addEventListener("change",()=>{
            this.save.set_variable("cv_loadout_name",this.content.insert_name.value)
        })

        this.content.settings.graphics_textures.value=this.save.get_variable("cv_graphics_resolution")
        this.content.settings.graphics_textures.addEventListener("change",()=>{
            this.save.set_variable("cv_graphics_resolution",this.content.settings.graphics_textures.value)
        })

        this.content.settings.graphics_particles.value=this.save.get_variable("cv_graphics_particles")
        this.content.settings.graphics_particles.addEventListener("change",()=>{
            this.save.set_variable("cv_graphics_particles",this.content.settings.graphics_particles.value)
        })
        this.content.settings_tabs.style.display="none"

        this.content.btn_settings.addEventListener("click",()=>{
            this.content.settings_tabs.style.display=this.content.settings_tabs.style.display==="none"?"block":'none'
        })
    }
    game_start(){
        this.content.settings_tabs.style.display="none"
    }
}