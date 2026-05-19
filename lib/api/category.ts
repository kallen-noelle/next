import api from "@/lib/axios";
import type { PageVO, Category, PageDTO } from "@/lib/types";

export async function getList() {
  return api.post<PageVO<Category>, PageVO<Category>>("/category/page", {
    pageNum: 1,
    pageSize: 200,
  } satisfies PageDTO<Category>);
}

export async function create(data: Category) { return api.post("/category", data); }
export async function update(data: Category) { return api.put("/category", data); }
export async function remove(id: number) { return api.delete(`/category/${id}`); }
