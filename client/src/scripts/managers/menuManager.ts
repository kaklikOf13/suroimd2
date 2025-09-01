import { Skins } from "common/scripts/definitions/loadout/skins.ts";
import { type GameConsole } from "../engine/console.ts";
import { ResourcesManager } from "../engine/resources.ts";
import { HideElement, ShowElement } from "../engine/utils.ts";
import { api, API_BASE } from "../others/config.ts";
import { RegionDef } from "common/scripts/config/config.ts";
import { ShowTab } from "../engine/mod.ts";
import { SoundManager } from "../engine/sounds.ts";

export class MenuManager{
    save:GameConsole
    content={
        insert_name:document.body.querySelector("#insert-name") as HTMLInputElement,
        menu_p:document.body.querySelector("#menu-options") as HTMLDivElement,

        select_region:document.body.querySelector("#select-region") as HTMLButtonElement,

        settings:{
            graphics_textures:document.body.querySelector("#settings-graphics-texture") as HTMLSelectElement,
            graphics_particles:document.body.querySelector("#settings-graphics-particles") as HTMLSelectElement,
            graphics_lights:document.body.querySelector("#settings-graphics-lights") as HTMLSelectElement,
            graphics_climate:document.body.querySelector("#settings-graphics-climate") as HTMLInputElement,

            game_friendly_fire:document.body.querySelector("#settings-game-friendly-fire") as HTMLInputElement,
            game_client_interpolation:document.body.querySelector("#settings-game-interpolation") as HTMLInputElement,
            game_client_rotation:document.body.querySelector("#settings-game-client-rotation") as HTMLInputElement,
            game_ping:document.body.querySelector("#settings-game-ping") as HTMLInputElement,

            sounds_master_volume:document.body.querySelector("#settings-sounds-master-volume") as HTMLInputElement,
        },

        /*
        btn_settings:document.body.querySelector("#btn-settings") as HTMLButtonElement,

        settings_tabs:document.body.querySelector("#settings-tabs") as HTMLDivElement,
        section_tabs:document.body.querySelector("#sections-tabs") as HTMLDivElement,
        registry:{
            name:document.body.querySelector("#input-register-name") as HTMLInputElement,
            password:document.body.querySelector("#input-register-password") as HTMLInputElement,
            confirm_password:document.body.querySelector("#input-register-confirm-password") as HTMLInputElement,
            btn:document.body.querySelector("#btn-register") as HTMLButtonElement,
        },
        login:{
            name:document.body.querySelector("#input-login-name") as HTMLInputElement,
            password:document.body.querySelector("#input-login-password") as HTMLInputElement,
            confirm_password:document.body.querySelector("#input-login-confirm-password") as HTMLInputElement,
            btn:document.body.querySelector("#btn-login") as HTMLButtonElement,
        },
        ac_status:document.body.querySelector("#account-status") as HTMLDivElement,
        sections_tab:document.body.querySelector("#sections-tabs") as HTMLDivElement,*/

        submenus:{
            play:document.body.querySelector("#menu-play-submenu") as HTMLElement,
            loadout:document.body.querySelector("#menu-loadout-submenu") as HTMLElement,
            settings:document.body.querySelector("#menu-settings-submenu") as HTMLElement,
            about:document.body.querySelector("#menu-about-submenu") as HTMLElement,
            extras:{
                loadout_c:document.body.querySelector("#loadout-sm-extra-content") as HTMLElement,
                loadout_v:document.body.querySelector("#loadout-sm-extra-view") as HTMLElement
            },
            buttons:{
                campaign:document.body.querySelector("#btn-play-campaign") as HTMLButtonElement,

                graphics:document.body.querySelector("#btn-settings-graphics") as HTMLButtonElement,
                game:document.body.querySelector("#btn-settings-game") as HTMLButtonElement,
                sounds:document.body.querySelector("#btn-settings-sounds") as HTMLButtonElement,
                keys:document.body.querySelector("#btn-settings-keys") as HTMLButtonElement,

                social:document.body.querySelector("#btn-about-social") as HTMLButtonElement,
                news:document.body.querySelector("#btn-about-news") as HTMLButtonElement,
                rules:document.body.querySelector("#btn-about-rules") as HTMLButtonElement,
                credits:document.body.querySelector("#btn-about-credits") as HTMLButtonElement,
            }
        }
    }
    resources:ResourcesManager
    submenu_param:boolean
    sounds:SoundManager
    constructor(save:GameConsole,resources:ResourcesManager,sounds:SoundManager){
        this.save=save
        /*this.content.btn_settings.addEventListener("click",()=>{
            ToggleElement(this.content.settings_tabs)
        })*/
        const params = new URLSearchParams(self.location.search);
        const submenu = params.get("menu")
        this.sounds=sounds
        this.menu_tabs["play"]={
            "campaign":document.body.querySelector("#campaign-levels") as HTMLElement,
            "gamemode":document.body.querySelector("#gamemode-image") as HTMLElement,
        }
        this.menu_tabs["settings"]={
            "graphics":document.body.querySelector("#settings-sm-graphics") as HTMLElement,
            "game":document.body.querySelector("#settings-sm-game") as HTMLElement,
            "sounds":document.body.querySelector("#settings-sm-sounds") as HTMLElement,
        }
        this.menu_tabs["about"]={
            "social":document.body.querySelector("#about-sm-social") as HTMLElement,
            "news":document.body.querySelector("#about-sm-news") as HTMLElement,
            "rules":document.body.querySelector("#about-sm-rules") as HTMLElement,
            "credits":document.body.querySelector("#about-sm-credits") as HTMLElement,
        }
        this.load_menu(submenu)
        this.submenu_param=!!params
        this.resources=resources
        this.update_api()
    }
    menu_tabs:Record<string,Record<string,HTMLElement>>={}
    load_menu(submenu:string|null){
        HideElement(this.content.submenus.play,true)
        HideElement(this.content.submenus.loadout,true)
        HideElement(this.content.submenus.settings,true)
        HideElement(this.content.submenus.about,true)
        if(submenu){
            HideElement(this.content.menu_p)
            switch(submenu){
                case "play":
                    this.load_resources()
                    ShowElement(this.content.submenus.play,true)
                    ShowTab("gamemode",this.menu_tabs["play"])
                    break
                case "loadout":
                    this.load_resources(["common"]).then(()=>{
                        ShowElement(this.content.submenus.loadout,true)
                        this.show_your_skins()
                    })
                    break
                case "settings":
                    ShowElement(this.content.submenus.settings,true)
                    ShowTab("graphics",this.menu_tabs["settings"])
                    break
                case "about":
                    ShowElement(this.content.submenus.about,true)
                    ShowTab("social",this.menu_tabs["about"])
                    break
                }
        }
        
    }
    loaded=false
    async load_resources(textures:string[]=["normal","common"]){
        if(this.loaded)return
        for(const tt of textures){
            const spg=await(await fetch(`atlases/atlas-${tt}-data.json`)).json()
            for(const s of spg[this.save.get_variable("cv_graphics_resolution")]){
                await this.resources.load_spritesheet("",s)
            }
        }
        await this.resources.load_group("/sounds/game/common.json")
        this.loaded=true
    }
    regions:Record<string,RegionDef>={}
    async update_api(){
        this.content.select_region.innerHTML=""
        if(api){
            this.regions=await(await fetch(`${API_BASE}/get-regions`)).json()
        }else{
            this.regions={
                "local":{host:"localhost",port:8000}
            }
        }
        for(const region of Object.keys(this.regions)){
            this.content.select_region.insertAdjacentHTML("beforeend",`<option value=${region}>${region}</option>`)
        }
        this.content.select_region.value=this.save.get_variable("cv_game_region")
    }
    accounts_system_init(){
        /*this.content.registry.btn.addEventListener("click",async()=>{
            const password=this.content.registry.password.value
            const passwc=this.content.registry.confirm_password.value
            if(password!==passwc)return
            const name=this.content.registry.name.value
            const res = await fetch(`http${api_server.toString()}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, password }),
                
            });

            if (res.status === 201) {
                const res = await fetch(`${api_server.toString("http")}/login`, {
                    method: "POST",
                    mode:"no-cors",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, password })
                });
                alert("Registered successfully!");
            } else {
                const text = await res.text();
                alert(`Registration failed: ${text}`);
            }
            this.update_account()
        })
        this.content.login.btn.addEventListener("click",async()=>{
            const password=this.content.login.password.value
            const name=this.content.login.name.value
            const res = await fetch(`${api_server.toString("http")}/login`, {
                method: "POST",
                mode:"no-cors",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, password })
            });
            this.update_account()
        })*/
        this.no_logged()
        this.update_account()
    }
    start(){
        this.content.insert_name.value=this.save.get_variable("cv_loadout_name")
        this.content.insert_name.addEventListener("change",()=>{
            this.save.set_variable("cv_loadout_name",this.content.insert_name.value)
        })
        this.content.select_region.addEventListener("change",()=>{
            this.save.set_variable("cv_game_region",this.content.select_region.value)
        })

        this.content.submenus.buttons.campaign.addEventListener("click",(_)=>ShowTab("campaign",this.menu_tabs["play"]))

        this.content.submenus.buttons.graphics.addEventListener("click",(_)=>ShowTab("graphics",this.menu_tabs["settings"]))
        this.content.submenus.buttons.game.addEventListener("click",(_)=>ShowTab("game",this.menu_tabs["settings"]))
        this.content.submenus.buttons.sounds.addEventListener("click",(_)=>ShowTab("sounds",this.menu_tabs["settings"]))

        this.content.submenus.buttons.social.addEventListener("click",(_)=>ShowTab("social",this.menu_tabs["about"]))
        this.content.submenus.buttons.news.addEventListener("click",(_)=>ShowTab("news",this.menu_tabs["about"]))
        this.content.submenus.buttons.rules.addEventListener("click",(_)=>ShowTab("rules",this.menu_tabs["about"]))
        this.content.submenus.buttons.credits.addEventListener("click",(_)=>ShowTab("credits",this.menu_tabs["about"]))

        //Graphics
        this.content.settings.graphics_textures.value=this.save.get_variable("cv_graphics_resolution")
        this.content.settings.graphics_textures.addEventListener("change",()=>{
            this.save.set_variable("cv_graphics_resolution",this.content.settings.graphics_textures.value)
        })
        this.content.settings.graphics_particles.value=this.save.get_variable("cv_graphics_particles")
        this.content.settings.graphics_particles.addEventListener("change",()=>{
            this.save.set_variable("cv_graphics_particles",this.content.settings.graphics_particles.value)
        })
        this.content.settings.graphics_lights.value=this.save.get_variable("cv_graphics_lights")
        this.content.settings.graphics_lights.addEventListener("change",()=>{
            this.save.set_variable("cv_graphics_lights",this.content.settings.graphics_lights.value)
        })
        this.content.settings.graphics_climate.checked=this.save.get_variable("cv_graphics_climate")
        this.content.settings.graphics_climate.addEventListener("click",()=>{
            this.save.set_variable("cv_graphics_climate",this.content.settings.graphics_climate.checked)
        })
        //Game
        this.content.settings.game_friendly_fire.checked=this.save.get_variable("cv_game_friendly_fire")
        this.content.settings.game_friendly_fire.addEventListener("click",()=>{
            this.save.set_variable("cv_game_friendly_fire",this.content.settings.game_friendly_fire.checked)
        })
        this.content.settings.game_client_interpolation.checked=this.save.get_variable("cv_game_interpolation")
        this.content.settings.game_client_interpolation.addEventListener("click",()=>{
            this.save.set_variable("cv_game_interpolation",this.content.settings.game_client_interpolation.checked)
        })
        this.content.settings.game_client_rotation.checked=this.save.get_variable("cv_game_client_rot")
        this.content.settings.game_client_rotation.addEventListener("click",()=>{
            this.save.set_variable("cv_game_client_rot",this.content.settings.game_client_rotation.checked)
        })
        this.content.settings.game_ping.addEventListener("change",()=>{
            this.save.set_variable("cv_game_ping",this.content.settings.game_ping.value)
        })
        this.content.settings.game_ping.value=this.save.get_variable("cv_game_ping")

        //Sounds
        this.content.settings.sounds_master_volume.addEventListener("change",()=>{
            this.save.set_variable("cv_sounds_master_volume",this.content.settings.sounds_master_volume.value)
            this.sounds.masterVolume=this.save.get_variable("cv_sounds_master_volume")/100
        })
        this.content.settings.sounds_master_volume.value=this.save.get_variable("cv_sounds_master_volume")
        this.sounds.masterVolume=this.save.get_variable("cv_sounds_master_volume")/100

        /*
        HideElement(this.content.settings_tabs)
        HideElement(this.content.section_tabs)*/

        if(api)this.accounts_system_init()
    }
    no_logged(){
        /*this.content.ac_status.innerHTML=""
        const btn=document.createElement("button") as HTMLButtonElement
        btn.classList.add("btn-green")
        btn.innerText="Account"
        btn.addEventListener("click",()=>{
            ShowElement(this.content.section_tabs)
        })
        this.content.ac_status.appendChild(btn)*/
    }
    logged(name:string){
        /*this.content.ac_status.innerHTML=`
            <a href="/user/?user=${name}"><button class="btn-blue">My Status</button></a>`*/
    }
    your_skins:string[]=["default_skin","nick_winner","widower","kaklik"]
    show_your_skins(){
        this.content.submenus.extras.loadout_c.innerHTML=""
        let sel=this.save.get_variable("cv_loadout_skin")
        if(!Skins.exist(sel))sel="default_skin"
        for(const s of this.your_skins){
            const skin=document.createElement("div")
            skin.id="skin-sel-"+s
            skin.innerHTML=`
<div class="name text">${s}</div>
<img src="${this.resources.get_sprite(s+"_body").src}" class="simage"></div>
            `
            skin.classList.add("skin-view-menu")
            if(s===sel){
                skin.classList.add("skin-view-menu-selected")
            }
            skin.addEventListener("click",this.update_sel_skin.bind(this,s))
            this.content.submenus.extras.loadout_c.appendChild(skin)
        }
        this.update_ss_view(sel)
    }
    update_sel_skin(sel=""){
        if(!Skins.exist(sel))sel="default_skin"
        this.save.set_variable("cv_loadout_skin",sel)
        const ss=this.content.submenus.extras.loadout_c.querySelectorAll(".skin-view-menu-selected")
        ss.forEach((v,_)=>{
            v.classList.remove("skin-view-menu-selected")
        })
        const skin=this.content.submenus.extras.loadout_c.querySelector("#skin-sel-"+sel) as HTMLDivElement
        skin.classList.add("skin-view-menu-selected")
        this.update_ss_view(sel)
    }
    update_ss_view(sel:string){
        this.content.submenus.extras.loadout_v.innerHTML=`
            <img src="${this.resources.get_sprite(sel+"_body").src}" class="simage"></div>
        `
    }
    update_account(){
        /*fetch(`${api_server.toString("http")}/get-your-status`,{
            credentials: "include",
        }).then((a)=>a.json()).then((aa)=>{
            if(!aa.user){
                this.no_logged()
                console.log("not-logged")
                return
            }
            HideElement(this.content.section_tabs)
            this.logged(aa.user.name)
        })*/
    }
    game_start(){
        //HideElement(this.content.settings_tabs)
    }
}