import { KDate } from "common/scripts/engine/definitions.ts";
import { type Game } from "../others/game.ts";
import { HideElement, ShowElement } from "../engine/utils.ts";


export abstract class TabApp {
    name: string
    icon: string
    game: Game
    icon_element: HTMLDivElement
    element?: HTMLDivElement
    tab:TabManager

    get running():boolean{
        return this.element!==undefined
    }

    constructor(name: string, icon: string,tab:TabManager) {
        this.name = name
        this.icon = icon
        this.tab=tab
        this.game=tab.game

        this.icon_element = document.createElement("div")
        this.icon_element.className = "tab-app"
        this.icon_element.innerHTML = `
            <img src="${icon}" draggable="false" alt="${name}" title="${name}" class="tab-app-icon">
        `
    }

    begin():void{
        if(this.running)return
        this.element=document.createElement("div")
        this.element.classList.add("tab-app")
        this.on_run()
    }
    stop():void{

    }

    abstract on_run():void
    abstract on_stop():void
    abstract on_tick(dt:number):void
}
export class MessageTabApp extends TabApp{
    override on_run(): void {
        this.element!.classList.add("tab-message-app")
        this.element!.innerHTML = `
<div class="contacts-panel">
    <div class="contact">
        <div class="avatar">A</div>
        <div class="contact-info">
            Alice
        </div>
        <div class="contact-time">Yeaster Day</div>
    </div>
</div>
<div class="chat-panel">
    <div class="chat-header">
        <div class="chat-contact">Alice</div>
    </div>
    <div class="chat-messages"></div>
    <div class="chat-input">
        <input type="text" id="tab-message-app-input-msg" placeholder="Type A Message..." />
        <button id="tab-message-app-send-button">➤</button>
    </div>
</div>
        `
        
        this.messagesContainer = this.element!.querySelector(".chat-messages") as HTMLDivElement

        this.addMessage("Hey!", "other")
        this.addMessage("See Me In The Final. <3", "other")

        const btn=this.element!.querySelector("#tab-message-app-send-button") as HTMLButtonElement
        const input=this.element!.querySelector("#tab-message-app-input-msg") as HTMLButtonElement
        btn.onclick=(_e)=>{
            this.addMessage(input.value,"you")
            input.value=""
        }
        input.value=""
    }
    override on_stop(): void {
    }
    override on_tick(dt: number): void {
    }
    
    addMessage(text: string, from: "you" | "other") {
        if (!this.messagesContainer) return
        const msg = document.createElement("div")
        msg.classList.add("msg", from === "you" ? "sent" : "received")
        msg.innerText = text
        this.messagesContainer.appendChild(msg)

        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight
    }

    private messagesContainer?: HTMLDivElement
    constructor(tab:TabManager){
        super("Message","/img/menu/gui/tab/icons/map.png",tab)
    }
}
export type TabStyle = {
    primary: string
    secondary: string
    text: string
    wallpaper?: string
};
export enum TabState{
    InitialPage,
    App,

}
export class TabManager {
    game: Game
    tab = document.querySelector("#tab-view") as HTMLDivElement
    appsContainer = this.tab.querySelector("#tab-apps") as HTMLDivElement
    content = {
        header_text_1: document.querySelector("#tab-header-info-1") as HTMLSpanElement,
        wallpaper: this.tab.querySelector("#tab-content") as HTMLDivElement,
        tab_apps:this.tab.querySelector("#tab-apps") as HTMLDialogElement,
        tab_current_app:this.tab.querySelector("#tab-current-app") as HTMLDivElement,

        back_button:this.tab.querySelector("#tab-exit-button") as HTMLButtonElement,
    };

    full_tab: boolean = false
    visible_tab: boolean = true
    apps: TabApp[] = []

    state:TabState=TabState.InitialPage

    // deno-lint-ignore no-explicit-any
    variables:Record<string,any>={

    }

    constructor(game: Game) {
        this.game = game
        this.appsContainer.innerHTML=""
        this.set_wallpaper("/img/menu/gui/tab/tab_wallpaper_abstract.png")

        HideElement(this.content.tab_current_app)
        this.content.back_button.onclick=(_e)=>this.back_to_menu()

        this.add_app(new MessageTabApp(this))

        this.tab.onclick=(_e)=>{
            this.game.input_manager.focus=false
        }
    }

    toggle_tab_full() {
        this.full_tab = !this.full_tab
        this.tab.className = this.full_tab ? "tab-view-full" : "tab-view-minimized"
    }
    toggle_tab_visibility(){
        this.visible_tab = !this.visible_tab
        if(this.full_tab)this.toggle_tab_full()
        if(this.visible_tab){
            ShowElement(this.tab,true)
        }else{
            HideElement(this.tab,true)
        }
    }

    update_header(date: KDate) {
        const tt = date.hour >= 12 ? "PM" : "AM"
        const hours = tt === "PM" ? date.hour - 12 : date.hour
        const minutes = String(Math.floor(date.minute)).padStart(2, "0")

        this.content.header_text_1.innerText = `${hours}:${minutes}${tt} ${date.day}/${date.month}/${date.year}`
    }

    set_wallpaper(src: string) {
        this.content.wallpaper.style.backgroundImage = `url(${src})`
    }
    set_style(style: TabStyle) {
        const root = this.tab

        root.style.setProperty("--tab-primary", style.primary)
        root.style.setProperty("--tab-secondary", style.secondary)
        root.style.setProperty("--tab-text", style.text)

        if (style.wallpaper) {
            this.set_wallpaper(style.wallpaper)
        }
    }

    back_to_menu(){
        if(this.state===TabState.InitialPage)return
        HideElement(this.content.tab_current_app)
        ShowElement(this.content.tab_apps)
        this.state=TabState.InitialPage
    }

    open_app(app:TabApp){
        if(this.state===TabState.App)return
        app.begin()
        if(app.running){
            HideElement(this.content.tab_apps)
            ShowElement(this.content.tab_current_app)
            this.content.tab_current_app.innerHTML=""
            this.content.tab_current_app.appendChild(app.element!)
            this.state=TabState.App
        }
    }

    add_app(app: TabApp) {
        this.apps.push(app)
        this.appsContainer.appendChild(app.icon_element)

        app.icon_element.onclick=(_e)=>this.open_app(app)
    }

    remove_app(name: string) {
        const index = this.apps.findIndex(a => a.name === name)
        if (index >= 0) {
            this.apps[index].stop()
            this.apps[index].icon_element.remove()
            this.apps.splice(index, 1)
        }
    }
}
