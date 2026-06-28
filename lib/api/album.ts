import api from "@/lib/axios";
import type { PageVO, Album, Photo, PageDTO } from "@/lib/types";
import { detectMode, ensureData, getDetailData } from "@/lib/static-data";

// ========== Album ==========

export async function getPublishedList() {
  if ((await detectMode()) === "static") {
    try {
      const res = await fetch("/data/albums.json");
      if (!res.ok) return [];
      const data = (await res.json()) as { rows: Album[]; total: number };
      return (data.rows ?? []).filter((a) => a.isPublished !== 0);
    } catch {
      return [];
    }
  }
  return api.get<Album[], Album[]>("/album/list");
}   

export async function getAlbumDetail(id: number) {
  if ((await detectMode()) === "static") {
    try {
      const res = await fetch("/data/albums.json");
      if (!res.ok) return null;
      const data = (await res.json()) as { rows: Album[]; total: number };
      return (data.rows ?? []).find((a) => a.id === id) ?? null;
    } catch {
      return null;
    }
  }
  return api.get<Album, Album>(`/album/${id}`);
}

export async function getList(keyword?: string, pageNum = 1, pageSize = 20) {
  if ((await detectMode()) === "static") {
    return (await ensureData<PageVO<Album>>("albums")) ?? { rows: [], total: 0 };
  }
  return api.post<PageVO<Album>, PageVO<Album>>("/album/page", {
    pageNum, pageSize,
    query: keyword ? ({ title: keyword } as Album) : undefined,
  } satisfies PageDTO<Album>);
}

export async function createAlbum(data: Album) { return api.post("/album", data); }
export async function updateAlbum(data: Album) { return api.put("/album", data); }
export async function deleteAlbum(id: number) { return api.delete(`/album/${id}`); }

// ========== Photo ==========

export async function getPhotosByAlbum(albumId: number) {
  if ((await detectMode()) === "static") {
    try {
      const res = await fetch("/data/albums.json");
      if (!res.ok) return [];
      const data = (await res.json()) as { rows: Album[]; total: number };
      const album = (data.rows ?? []).find((a) => a.id === albumId);
      return album?.photos ?? [];
    } catch {
      return [];
    }
  }
  return api.get<Photo[], Photo[]>(`/photo/by-album/${albumId}`);
}

export async function createPhoto(data: Photo) { return api.post("/photo", data); }
export async function updatePhoto(data: Photo) { return api.put("/photo", data); }
export async function deletePhoto(id: number) { return api.delete(`/photo/${id}`); }
