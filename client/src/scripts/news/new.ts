//const newsS=document.querySelector("#updates-section") as HTMLDivElement

const news=[
    {
      "title":"Alpha 1.3.0",
      content:`
<h2 id="news">News</h2>
<hr>
<h3 id="main">Main</h3>
<ul>
<li><strong>Map!</strong></li>
<li><strong>Dynamic Lights</strong></li>
<li>Opitional Friendly Fire</li>
<li>Planes</li>
<li>Battle Plane</li>
<li>Gores</li>
</ul>
<hr>
<h3 id="creatures">Creatures</h3>
<ul>
<li>Chicken (Chicken Jockey)</li>
<li>Bots Simple AI(I Want Put A Tree After)</li>
</ul>
<hr>
<h3 id="weapons">Weapons</h3>
<ul>
<li><strong>DUAL WEAPONS/PISTOL!</strong></li>
<li>Pfeifer Zelikas - 308Sub revolver (banned in 40 countrys)</li>
<li>M9 - 9MM Pistol(Classic And Mayble Stopable)</li>
<li>M870 World Image</li>
</ul>
<hr>
<h3 id="items">Items</h3>
<ul>
<li>Consumibles Sounds</li>
<li>Consumibles Animation</li>
<li>Consumibles Particles</li>
</ul>
<hr>
<h3 id="graphics">Graphics</h3>
<ul>
<li>Vignetting</li>
<li>Rain</li>
<li>Tilt Shift</li>
<li>Color Adjust<h2 id="changes">Changes</h2>
</li>
</ul>
<hr>
<h3 id="main">Main</h3>
<ul>
<li>Movement Is Now By Axis</li>
<li>10 Ping Emulation</li>
</ul>
<hr>
<h2 id="fixes">Fixes</h2>
<ul>
<li>Barrel Smoke</li>
<li>Keys</li>
<li>Addiction Damage</li>
<li>Parachute</li>
</ul>
<hr>
<ul>
<li>Game Over</li>
<li>Settings<h1 id="play-the-game">Play The Game</h1>
</ul>
      `,
    },
    {
      "title":"Alpha 1.2.0",
      content:`
<h2 id="news">News</h2>
<hr>
<h3 id="main">Main</h3>
<ul>
<li>Forum</li>
<li>Users View</li>
</ul>
<hr>
<h2 id="fixes">Fixes</h2>
<hr>
<ul>
<li>Game Over</li>
<li>Settings</li>
</ul>
      `
    },
    {
      "title":"Alpha 1.1.0",
      "content":`
<h2 id="news">News</h2>
<hr>
<h3 id="mains">Mains</h3>
<ul>
<li>Player Graphics</li>
<li>Settings</li>
<li>Spritesheets</li>
<li>2D Sounds</li>
<li>Guns Sounds And Animations</li>
<li>Unfineshed Mobile Suport</li>
<li>Keybinds</li>
<li>Control Support</li>
<li>Terrain</li>
<li>Offline Version</li>
<li>Creatures And Animals</li>
<li>Bots</li>
<li>Vehicles</li>
<li>Golang API</li>
<li>Unfineshed Accounts System</li>
<li>Killleader</li>
<li>Killfeed</li>
<li>Expanded Inventory</li>
</ul>
<hr>
<h3 id="obstacles">Obstacles</h3>
<ul>
<li>Crate</li>
<li>Obstacles Residues</li>
</ul>
<hr>
<h3 id="guns">Guns</h3>
<ul>
<li>AR15 - 556mm Automatic</li>
<li>MP5 - 9mm Automatic</li>
<li>Uzi - 9mm Automatic</li>
<li>Bullet Image</li>
</ul>
<hr>
<h3 id="player">Player</h3>
<ul>
<li>Skins And Animations</li>
<li>Shield Break Animation</li>
</ul>
<hr>
<h3 id="melees">Melees</h3>
<ul>
<li>Survival Knife</li>
</ul>
<hr>
<h3 id="eastereggs">Eastereggs</h3>
<ul>
<li>Squid Game Easteregg</li>
<li>You Died Easteregg</li>
</ul>
<hr>
<h3 id="others">Others</h3>
<ul>
<li>Explosions Sprite</li>
<li>Loot Physics</li>
</ul>
<hr>
<h2 id="changes">Changes</h2>
<hr>
<ul>
<li>Particles Sprites</li>
<li>Vector Redesign</li>
<li>Collisions And Physics</li>
<li>Inventory System</li>
<li>Renderer</li>
</ul>
<hr>
<h3 id="others">Others</h3>
<ul>
<li>Bullet Through Obstacles</li>
<li>Loot Tables</li>
</ul>
<hr>
      `
    },
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
    //newsS.appendChild(d)
}