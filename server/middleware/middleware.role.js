export const ROLES = {
  SUPER: 'Super',
  RECEPTIONIST: 'Receptionist',
  TECHNICIAN: 'Technician',
  DOCTOR: 'Doctor',
  BRANCH: 'Branch',
  OFFICE: 'Office',
};

/**
 * Normalize upstream accessType to standard system roles
 */
export const normalizeRole = (accessType = '') => {
  const lower = accessType.toLowerCase();
  if (lower.includes('super') || lower.includes('admin')) {
    return ROLES.SUPER;
  }
  if (lower.includes('doctor') || lower.includes('patho')) {
    return ROLES.DOCTOR;
  }
  if (lower.includes('micro') || lower.includes('tech') || lower.includes('analyst') || lower.includes('lab')) {
    return ROLES.TECHNICIAN;
  }
  if (lower.includes('branch')) {
    return ROLES.BRANCH;
  }
  if (lower.includes('setting') || lower.includes('entry') || lower.includes('reception') || lower.includes('office')) {
    return ROLES.RECEPTIONIST;
  }
  return ROLES.RECEPTIONIST;
};

/**
 * Middleware to restrict endpoints to specific allowed roles
 */
export const requireRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        STATUS: 'FAILED',
        StatusCode: '401',
        Message: 'Unauthorized. Login required.',
      });
    }

    const userRole = req.user.role || normalizeRole(req.user.accessType);

    // Super user always has unrestricted access
    if (userRole === ROLES.SUPER || allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      STATUS: 'FAILED',
      StatusCode: '403',
      Message: `Access denied. Role '${userRole}' does not have sufficient permissions for this operation.`,
    });
  };
};
