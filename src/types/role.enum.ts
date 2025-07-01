export enum Role {
  USER = 'user',
  ADMIN = 'admin',
}

export type RoleType = Role;

// Helper functions for role operations
export const isValidRole = (role: string): role is Role => {
  return Object.values(Role).includes(role as Role);
};

export const getRoleValues = (): string[] => {
  return Object.values(Role);
};
