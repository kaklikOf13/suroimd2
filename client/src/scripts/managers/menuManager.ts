import { type GameConsole } from "../engine/console.ts";
import { HideElement, ShowElement, ToggleElement } from "../engine/utils.ts";
import { api_server, forum, offline } from "../others/config.ts";

export class MenuManager{
    save:GameConsole
    content={
        insert_name:document.body.querySelector("#insert-name") as HTMLInputElement,

        btn_settings:document.body.querySelector("#btn-settings") as HTMLButtonElement,

        settings_tabs:document.body.querySelector("#settings-tabs") as HTMLDivElement,
        settings:{
            graphics_textures:document.body.querySelector("#settings-graphics-texture") as HTMLSelectElement,
            graphics_particles:document.body.querySelector("#settings-graphics-particles") as HTMLSelectElement
        },
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
        sections_tab:document.body.querySelector("#sections-tabs") as HTMLDivElement,
    }
    constructor(save:GameConsole){
        this.save=save
        this.content.btn_settings.addEventListener("click",()=>{
            ToggleElement(this.content.settings_tabs)
        })
    }
    accounts_system_init(){
        this.content.registry.btn.addEventListener("click",async()=>{
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
        })
        this.no_logged()
        this.update_account()
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
        HideElement(this.content.settings_tabs)
        HideElement(this.content.section_tabs)

        if(!offline||forum)this.accounts_system_init()
    }
    no_logged(){
        this.content.ac_status.innerHTML=""
        const btn=document.createElement("button") as HTMLButtonElement
        btn.classList.add("btn-green")
        btn.innerText="Account"
        btn.addEventListener("click",()=>{
            ShowElement(this.content.section_tabs)
        })
        this.content.ac_status.appendChild(btn)
    }
    logged(name:string){
        this.content.ac_status.innerHTML=`
            <a href="/user/?user=${name}"><button class="btn-blue">My Status</button></a>`
    }
    update_account(){
        fetch(`${api_server.toString("http")}/get-your-status`,{
            credentials: "include",
        }).then((a)=>a.json()).then((aa)=>{
            if(!aa.user){
                this.no_logged()
                console.log("not-logged")
                return
            }
            HideElement(this.content.section_tabs)
            this.logged(aa.user.name)
        })
    }
    game_start(){
        HideElement(this.content.settings_tabs)
    }
}