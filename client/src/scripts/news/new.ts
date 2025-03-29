const newsS=document.querySelector("#updates-section") as HTMLDivElement

import news from "./news.json"

for(const n of news){
    const d=document.createElement("div")
    d.classList.add("update-item")
    d.innerHTML=`<h2>${n.title}</h2>`+n.content
    newsS.appendChild(d)
}