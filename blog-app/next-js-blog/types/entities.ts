export enum PostType {
  POST = "post",
  PAGE = "page",
  STORY = "story",
  SERIES = "series",
}

export enum PostStatus {
  DRAFT = "draft",
  SCHEDULED = "scheduled",
  REVIEW = "review",
  PUBLISHED = "published",
}

export interface User {
  id: number;
  firstName: string;
  lastName?: string;
  email: string;
  googleId?: string;
  posts?: Post[];
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  schema?: string;
  featuredImageUrl?: string;
  createDate: string;
  updateDate: string;
  deletedAt?: string;
}

export interface MetaOptions {
  id: number;
  metaValue: string;
  createdDate: string;
  updateDate: string;
}

export interface Post {
  id: number;
  title: string;
  postType: PostType;
  slug: string;
  status: PostStatus;
  content?: string;
  schema?: string;
  featuredImageUrl?: string;
  publishedOn: string;
  tags: Tag[];
  metaOptions?: MetaOptions;
  author: User;
}

export interface CreatePostPayload {
  title: string;
  postType: PostType;
  slug: string;
  status: PostStatus;
  content?: string;
  schema?: string;
  featuredImageUrl?: string;
  publishedOn: string;
  tags?: number[];
  metaOptions?: { metaValue: string };
}

export interface UpdatePostPayload extends Partial<CreatePostPayload> {
  id: number;
}

export interface CreateTagPayload {
  name: string;
  slug: string;
  description?: string;
  schema?: string;
  featuredImageUrl?: string;
}
