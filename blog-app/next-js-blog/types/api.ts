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
