
import {api_server} from "../../../src/scripts/others/config.ts"
export const API_BASE="http"+api_server.toString()
export interface User{
  name:string
  inventory:string //JSON
  coins:number
  xp:number
  score:number
}
export interface Inventory {
  skins: number[];
  items: Record<string, any>;
}
export async function GetUser(username:string):Promise<{user:User}>{
  const res = await fetch(`${API_BASE}/get-status/${username}`);
  return (await res.json());
}