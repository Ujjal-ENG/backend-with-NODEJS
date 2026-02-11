import type { PermissionKey, UserRole } from "@/types/entities";

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

export interface PaginationMeta {
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
}

export interface PaginationLinks {
  first: string;
  previous: string;
  current: string;
  next: string;
  last: string;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface CurrentUserPresence {
  userId: number;
  isOnline: boolean;
  lastSeenAt: string | null;
}

export interface PostCreatorPresenceUser {
  id: number;
  firstName: string;
  lastName?: string;
  email: string;
  role: UserRole;
  isOnline: boolean;
  lastSeenAt: string | null;
  canCreatePost: boolean;
  effectivePermissions: PermissionKey[];
}

export interface PostCreatorPresenceView {
  checkedAt: string;
  total: number;
  onlineCount: number;
  offlineCount: number;
  users: PostCreatorPresenceUser[];
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
}

export interface RolePermissionCatalog {
  roles: string[];
  permissions: string[];
  defaultRolePermissions: Record<string, string[]>;
}
