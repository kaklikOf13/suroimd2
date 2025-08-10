
import {api_server} from "../../../src/scripts/others/config.ts"
export const API_BASE="http"+api_server.toString()
export interface Post{
  id:number
  author:string
}
export async function listPosts(limit = 20, offset = 0) {
  const res = await fetch(`${API_BASE}/forum/posts?limit=${limit}&offset=${offset}`, { credentials: "include" });
  return res.json();
}

export async function getPost(id: number) {
  const res = await fetch(`${API_BASE}/forum/post/${id}`, { credentials: "include" });
  return res.json();
}

export async function createPost(title: string, body: string) {
  const res = await fetch(`${API_BASE}/forum/create-post`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body })
  });
  return res.json();
}

export async function createComment(postId: number, body: string) {
  const res = await fetch(`${API_BASE}/forum/post/${postId}/comment`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body })
  });
  return res.text();
}
export async function getCurrentUserName() {
  const res = await fetch(`${API_BASE}/get-your-status`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  return (await res.json()).user.name;
}
export async function deletePost(post:Post) {
  await fetch(`${API_BASE}/forum/delete-post/${post.id}`, { method: "DELETE", credentials: "include" });
}

export async function deleteComentary(id:string) {
  await fetch(`${API_BASE}/forum/delete-comment/${id}`, { method: "DELETE", credentials: "include" });
}