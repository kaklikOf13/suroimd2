import { GetUser, Inventory } from "./api.ts";
import "../scss/main.scss"
async function loadUser(username: string) {
  const data = await GetUser(username);
  console.log("Raw data from API:", data);
  if (!data || !data.user) {
    const userInfoEl = document.querySelector("#user-info");
    if (userInfoEl) userInfoEl.innerHTML = "<p>User not found</p>";
    else console.error("Element #user-info not found!");
    return;
  }

  const user = data.user;
  let inventory: Inventory = { skins: [], items: {} };
  try {
    inventory = JSON.parse(user.inventory);
  } catch {}

  const userInfoEl = document.querySelector("#user-info") as HTMLDivElement;
  userInfoEl.innerHTML = `
    <p><strong>Name:</strong> ${user.name}</p>
    <p><strong>Coins:</strong> ${user.coins}</p>
    <p><strong>XP:</strong> ${user.xp}</p>
    <p><strong>Score:</strong> ${user.score}</p>
  `;

  const skinsEl = document.getElementById("user-skins")!;
  skinsEl.innerHTML = "";
  if (inventory.skins.length === 0) {
    skinsEl.innerHTML = "<p>No skins owned</p>";
  } else {
    inventory.skins.forEach((skinId) => {
      const card = document.createElement("div");
      card.className = "skin-card";
      // Placeholder para imagem da skin, se existir
      card.innerHTML = `
        <div class="skin-image">#${skinId}</div>
        <div class="skin-label">Skin #${skinId}</div>
      `;
      skinsEl.appendChild(card);
    });
  }
}

const params = new URLSearchParams(window.location.search);

const username = params.get("user") || "defaultUsername";
loadUser(username);