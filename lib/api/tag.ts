import api from "@/lib/axios";
import type { PageVO, Tag, PageDTO } from "@/lib/types";

export async function getList() {
  return api.post<PageVO<Tag>, PageVO<Tag>>("/tag/page", {
    pageNum: 1,
    pageSize: 200,
  } satisfies PageDTO<Tag>);
}
