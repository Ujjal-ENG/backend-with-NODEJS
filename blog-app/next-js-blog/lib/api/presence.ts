import { apiFetch } from "@/lib/api-client";
import type {
  CurrentUserPresence,
  PostCreatorPresenceView,
} from "@/types/api";

export async function getPostCreatorsPresence() {
  return apiFetch<PostCreatorPresenceView>("/users/presence/post-creators", {
    cache: "no-store",
    tags: ["presence-post-creators"],
  });
}

export async function markPresenceOnline() {
  return apiFetch<CurrentUserPresence>("/users/presence/ping", {
    method: "POST",
    cache: "no-store",
  });
}

export async function markPresenceOffline() {
  return apiFetch<CurrentUserPresence>("/users/presence/offline", {
    method: "POST",
    cache: "no-store",
  });
}
