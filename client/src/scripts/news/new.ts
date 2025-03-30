const newsS=document.querySelector("#updates-section") as HTMLDivElement

const news=[
    {
        "title":"Alpha 1.0.0",
        "content":
`<h2>News</h2>
<h3> Guns</h3>
  * <b>Vector</b> - 9mm. Automatic<br>
  * <b>Awp</b> Design<br>
  * <b>Awms</b> Design<br>
<h3> Others</h3>
  * Damage Texts<br>
  * Critical Hits<br>
  * Game Over Gui<br>
<h2> Changes</h2>
<h3> Consumibles</h3>
<h5> Healings</h5>
   * </b>Medikit</b> Redesign<br>
   * </b>Gauze</b> Redesign<br>
   * </b>Lifecandy</b> Redesign<br>
<h5> Shield</h5>
  * <b>Blue Potion</b> Redesign<br>
  * <b>Small Blue Potion</b> Redesign<br>
<h5> Mana</h5>
  * <b>Purple Potion</b> Redesign<br>
  * <b>Small Purple Potion</b> Redesign<br>
<h5> Adrenaline</h5>
   * <b>Soda</b> Redesign<br>
   * <b>Inhaler</b> Redesign<br>
<h3>  Ammos</h5>
  * <b>762mm</b> Redesign<br>
  * <b>556mm</b> Redesign<br>
  * <b>9mm</b> Redesign<br>
  * <b>22lr</b> Redesign<br>
  * <b>12g</b> Redesign<br>
  * <b>308 Subsonic</b> Redesign<br>
  * <b>40mm</b> Redesign<br>
  * <b>50cal</b> Redesign<br>
<h3> Others</h3>
* <b>Ground Color</b> Changed`
    },
    {
        "title":"Pre-Alpha 1.0.0",
        "content":"<h3>The Game Is Alive</h3>"
    }
]

for(const n of news){
    const d=document.createElement("div")
    d.classList.add("update-item")
    d.innerHTML=`<h2>${n.title}</h2>`+n.content
    newsS.appendChild(d)
}