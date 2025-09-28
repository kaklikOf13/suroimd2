import { KDate } from "common/scripts/engine/definitions.ts";
import { type Game } from "../others/game.ts";
import { HideElement, ShowElement } from "../engine/utils.ts";

export class TabApp {
    name: string
    icon: string
    game: Game
    element: HTMLDivElement

    constructor(name: string, icon: string, game: Game) {
        this.name = name
        this.icon = icon
        this.game = game

        this.element = document.createElement("div")
        this.element.className = "tab-app"
        this.element.innerHTML = `
            <img src="${icon}" draggable="false" alt="${name}" title="${name}" class="tab-app-icon">
        `
    }
}
export type TabStyle = {
    primary: string
    secondary: string
    text: string
    wallpaper?: string
};

export class TabManager {
    game: Game
    tab = document.querySelector("#tab-view") as HTMLDivElement
    appsContainer = this.tab.querySelector("#tab-apps") as HTMLDivElement
    content = {
        header_text_1: document.querySelector("#tab-header-info-1") as HTMLSpanElement,
        wallpaper: this.tab.querySelector("#tab-content") as HTMLDivElement
    };

    full_tab: boolean = false
    visible_tab: boolean = true
    apps: TabApp[] = []

    constructor(game: Game) {
        this.game = game
        this.appsContainer.innerHTML=""
        this.add_app(new TabApp("Map","/img/menu/gui/tab/icons/map.png",this.game))
        this.set_wallpaper("/img/menu/gui/tab/tab_wallpaper_abstract.png")
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

    add_app(app: TabApp) {
        this.apps.push(app)
        this.appsContainer.appendChild(app.element)
    }

    remove_app(name: string) {
        const index = this.apps.findIndex(a => a.name === name)
        if (index >= 0) {
            this.apps[index].element.remove()
            this.apps.splice(index, 1)
        }
    }
}
