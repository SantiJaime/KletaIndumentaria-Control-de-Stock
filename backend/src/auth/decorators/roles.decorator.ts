import { SetMetadata } from '@nestjs/common';
import type { Role } from '../../generated/prisma/enums.js';

export const ROLES_KEY = 'roles';

/** Restringe una ruta a los roles indicados (ej. `@Roles(Role.admin)`). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
