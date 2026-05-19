import api from "@/lib/axios";
import type { PageVO, Media, PageDTO } from "@/lib/types";

export async function getList(params: PageDTO<Media>) {
  return api.post<PageVO<Media>, PageVO<Media>>("/media/page", params);
}

export async function upload(file: File) {
  const form = new FormData();
  form.append("file", file);
  return api.post("/media/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function remove(id: number) {
  return api.delete(`/media/${id}`);
}
