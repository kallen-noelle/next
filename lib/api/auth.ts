import api from "@/lib/axios";
import type { User } from "@/lib/types";

export async function login(username: string, password: string): Promise<{ token: string; user: User }> {
  return api.post("/auth/login", { username, password });
}

export async function register(data: { username: string; password: string; nickname?: string; email?: string }): Promise<User> {
  return api.post("/user", data);
}

export function getGithubUrl(): Promise<string> {
  return api.get("/auth/github");
}

// /auth/me returns just the user ID, not a full user object.
// User info is persisted via setAuth → localStorage instead.
export function getMe(): Promise<number> {
  return api.get("/auth/me");
}
