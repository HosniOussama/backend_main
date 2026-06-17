import { ERole } from './enums';

export const normalizeRole = (role?: string): ERole | undefined => {
  if (!role) return undefined;

  if (Object.values(ERole).includes(role as ERole)) {
    return role as ERole;
  }

  return undefined;
};

export const hasRole = (
  role: string | undefined,
  ...allowedRoles: ERole[]
): boolean => {
  const normalizedRole = normalizeRole(role);

  return normalizedRole ? allowedRoles.includes(normalizedRole) : false;
};
