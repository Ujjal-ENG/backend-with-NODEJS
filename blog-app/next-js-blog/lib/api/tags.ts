import { Tag } from "@/types/entities";
import { apiFetch } from "../api-client";

export async function getTags() {
  return apiFetch<Tag[]>(`/tags`, {
    tags: ["tags"],
  });
}
