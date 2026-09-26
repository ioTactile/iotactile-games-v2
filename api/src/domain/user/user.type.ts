export const Role = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export interface UserType {
  id: string;
  email: string;
  password: string;

  username: string;

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  role: Role;
}
