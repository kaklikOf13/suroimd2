import { Config } from "../../configs/config.ts";
import { Server } from "../engine/mod.ts";
import { Cors } from "../engine/server.ts";
import { DB } from "https://deno.land/x/sqlite/mod.ts";
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
export class ApiServer{
    server:Server
    accounts_db?:DB;
    shop:{
        skins:Partial<Record<number,number>>
    }={
        skins:{}
    }
    constructor(server:Server){
        this.server=server
        this.server.route("/get-regions",(_req:Request,_url:string[], _info: Deno.ServeHandlerInfo)=>{
            return Cors(new Response(JSON.stringify(Config.regions),{status:200}))
        })
        this.server.route("/get-shop",(_req:Request,_url:string[], _info: Deno.ServeHandlerInfo)=>{
            return Cors(new Response(JSON.stringify(Config.shop),{status:200}))
        })
        if(Config.database.enabled)this.db_init()
        this.shop.skins=Config.shop.skins
    }
    db_init(){
        Deno.mkdir("database",{recursive:true})
        this.accounts_db=new DB(Config.database.files.accounts)
        this.accounts_db.execute(`
        CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            inventory TEXT DEFAULT '{"skins":[],"items":{}}',
            score INTEGER DEFAULT 0,
            coins INTEGER DEFAULT 0,
            xp INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        this.server.route("/register", async (req, _url, _info) => {
            if (req.method !== "POST") {
                return Cors(new Response(null, {
                    status: 204,
                }));
            }
            const body = await req.json();
            const name = body?.name?.trim();
            const password = body?.password?.trim();

            if (!name || !password) {
                return Cors(new Response("Missing name or password", { status: 400 }));
            } 

            if (name.length < 3 || password.length < 4) {
                return Cors(new Response("Name or password too short", { status: 400 }));
            }

            const existing = this.accounts_db?.queryEntries<{ name: string }>(
                "SELECT name FROM players WHERE name = ?",
                [name]
            );
            if (existing && existing.length > 0) {
                return Cors(new Response("User already exists", { status: 409 }));
            }
            
            const password_hash = await hashPassword(password);
            this.accounts_db?.query(
                "INSERT INTO players (name, password_hash) VALUES (?, ?)",
                [name, password_hash]
            );

            console.log("new account",name)

            return Cors(new Response("Registered", { status: 201 }));
        });
        this.server.route("/login", async (req, _url, _info) => {
            if (req.method !== "POST") {
                return Cors(new Response(null, { status: 204 }));
            }

            let body;
            try {
                body = await req.json();
            } catch {
                return Cors(new Response("Invalid JSON", { status: 400 }));
            }

            const name = body?.name?.trim();
            const password = body?.password?.trim();
            if (!name || !password) {
                return Cors(new Response("Missing name or password", { status: 400 }));
            }

            const result = this.accounts_db?.queryEntries<{ name: string; password_hash: string }>(
                "SELECT name, password_hash FROM players WHERE name = ?",
                [name]
            );

            if (!result || result.length === 0) {
                return Cors(new Response("User not found", { status: 404 }));
            }

            const user = result[0];
            const password_hash = await hashPassword(password);
            if (user.password_hash !== password_hash) {
                return new Response("Wrong password", { status: 403 });
            }

            const headers = new Headers({
                "Set-Cookie": `user=${encodeURIComponent(user.name)}; Path=/; HttpOnly`,
                "Content-Type": "text/plain",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true",
            });

            return new Response("Logged in", { status: 200, headers });
        });
        this.server.route("/get-your-status", (req: Request, _url, _info) => {
            if (req.method !== "GET") {
                return new Response(null, { status: 204 });
            }
            const cookie = req.headers.get("cookie") ?? "";
            const match = cookie.match(/user=([^;]+)/);
            const username = match ? decodeURIComponent(match[1]) : null;
            const origin = req.headers.get("origin") ?? "";

            if (!username) {
                return new Response("Not logged in", { status: 401,headers:{
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
            } });
            }

            const userData = this.accounts_db?.queryEntries<{ name: string; coins: number; xp: number; score: number; inventory:string }>(
                "SELECT name, coins, xp, score, inventory FROM players WHERE name = ?",
                [username]
            );

            return new Response(JSON.stringify({
                user: userData?.[0] ?? null,
            }), { status: 200, headers:{
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
            }});
        });
        this.server.route("/get-status", (req: Request, url, _info) => {
            if (req.method !== "GET") {
                return new Response(null, { status: 204 });
            }
            const username=url[1]
            const origin = req.headers.get("origin") ?? "";

            const userData = this.accounts_db?.queryEntries<{ name: string; coins: number; xp: number; score: number; inventory:string }>(
                "SELECT name, coins, xp, score, inventory FROM players WHERE name = ?",
                [username]
            );

            return new Response(JSON.stringify({
                user: userData?.[0] ?? null,
            }), { status: 200, headers:{
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
            }});
        });
        this.server.route("/internal/update-user", async (req, _url, _info) => {
            if (req.method !== "POST") {
                return new Response("Method not allowed", { status: 405 });
            }

            const origin = req.headers.get("origin") ?? "";
            const apiKey = req.headers.get("x-api-key");

            if (apiKey !== Config.database.api_key) {
                return new Response("Unauthorized", { status: 403 });
            }

            const data = await req.json();
            const name = data.name;
            const coins = data.coins ?? 0;
            const xp = data.xp ?? 0;
            const score = data.score ?? 0;

            if (!name) {
                return new Response("Missing username", { status: 400 });
            }

            this.accounts_db?.query(
                `UPDATE players SET 
                    coins = coins + ?, 
                    xp = xp + ?, 
                    score = score + ?
                WHERE name = ?`,
                [coins, xp, score, name]
            );

            return new Response("Updated", { status: 200, headers: {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Credentials": "true"
            }});
        });
        this.server.route("/buy-skin", (req: Request, url, _info) => {
            if (req.method !== "GET") {
                return new Response(null, { status: 204 });
            }

            const cookie = req.headers.get("cookie") ?? "";
            const match = cookie.match(/user=([^;]+)/);
            const username = match ? decodeURIComponent(match[1]) : null;
            const origin = req.headers.get("origin") ?? "";
            const skinId = parseInt(url[url.length - 1]);

            if (!username) {
                return new Response("Not logged in", {
                    status: 401,
                    headers: {
                        "Access-Control-Allow-Origin": origin,
                        "Access-Control-Allow-Credentials": "true",
                        "Access-Control-Allow-Headers": "Content-Type",
                        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
                    }
                });
            }

            const price = this.shop.skins[skinId];
            if (price === undefined) {
                return new Response("Invalid skin ID", { status: 400 });
            }

            const result = this.accounts_db?.queryEntries<{
                coins: number;
                inventory: string;
            }>(
                "SELECT coins, inventory FROM players WHERE name = ?",
                [username]
            );

            const player = result?.[0];
            if (!player) {
                return new Response("Player not found", { status: 404 });
            }

            let inventory = { skins: [], items: {} };
            try {
                inventory = JSON.parse(player.inventory);
            } catch {/**/}

            if (inventory.skins.includes(skinId as never)) {
                return new Response("Skin already owned", { status: 400 });
            }

            if (player.coins < price) {
                return new Response("Not enough coins", { status: 400 });
            }

            inventory.skins.push(skinId as never);
            this.accounts_db?.query(
                `UPDATE players 
                SET coins = coins - ?, inventory = ? 
                WHERE name = ?`,
                [price, JSON.stringify(inventory), username]
            );

            return new Response("Skin purchased", {
                status: 200,
                headers: {
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
                }
            });
        });
    }
    run(){
        this.server.run()
    }
}