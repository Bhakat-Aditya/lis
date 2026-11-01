export const ROLES = {
  SUPER: 'Super',
  SETTING: 'Setting', // Master Control - Setting
  RECEPTIONIST: 'Receptionist',
  OFFICE: 'Office',
  BRANCH: 'Branch',
  TECHNICIAN: 'Technician',
  MICROBIOLOGY: 'Microbiology',
  DOCTOR: 'Doctor',
};

/**
 * Normalize upstream accessType to standard system roles
 */
export const normalizeRole = (accessType = '') => {
  const lower = String(accessType || '').toLowerCase().trim();
  if (lower.includes('setting') || lower.includes('master control') || lower.includes('master')) {
    return ROLES.SETTING;
  }
  if (lower.includes('microbiology') || lower.includes('micro')) {
    return ROLES.MICROBIOLOGY;
  }
  if (lower.includes('super') || lower.includes('admin')) {
    return ROLES.SUPER;
  }
  if (lower.includes('doctor') || lower.includes('patho')) {
    return ROLES.DOCTOR;
  }
  if (lower.includes('branch')) {
    return ROLES.BRANCH;
  }
  if (lower.includes('tech') || lower.includes('analyst') || lower.includes('lab')) {
    return ROLES.TECHNICIAN;
  }
  if (lower.includes('office')) {
    return ROLES.OFFICE;
  }
  if (lower.includes('reception') || lower.includes('entry')) {
    return ROLES.RECEPTIONIST;
  }
  return ROLES.RECEPTIONIST;
};

/**
 * Middleware to restrict endpoints according to official role permissions
 * Supports:
 * - allowSuper: boolean (default: true; set to false for Master Data static updates)
 * - deniedRoles: array of roles explicitly forbidden (e.g. [ROLES.BRANCH] for Log & EMR)
 */
export const requireRoles = (allowedRoles = [], options = {}) => {
  const {
    allowSuper = true,
    deniedRoles = [],
    deniedMessage,
  } = options;

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        STATUS: 'FAILED',
        StatusCode: '401',
        Message: 'Unauthorized. Login required.',
      });
    }

    const userRole = req.user.role || normalizeRole(req.user.accessType);

    // 1. Check if role is explicitly denied for this endpoint
    if (deniedRoles.includes(userRole)) {
      return res.status(403).json({
        STATUS: 'FAILED',
        StatusCode: '403',
        Message: deniedMessage || `Access denied. Role '${userRole}' does not have access to this resource.`,
      });
    }

    // 2. Check if Super is restricted (Rule 6: Super has All Access EXCEPT Update Master Data static settings)
    if (userRole === ROLES.SUPER) {
      if (!allowSuper) {
        return res.status(403).json({
          STATUS: 'FAILED',
          StatusCode: '403',
          Message:
            deniedMessage ||
            `Access denied. Super role has all access EXCEPT updating Master Data static settings. Only 'Master Control - Setting' can update master static data.`,
        });
      }
      return next();
    }

    // 3. If allowedRoles is empty (and user role is not explicitly denied), permit access
    if (allowedRoles.length === 0) {
      return next();
    }

    // 4. Check allowed roles list (Treat Receptionist & Office identically as Reception/Office)
    const isReceptionOrOfficeAllowed =
      allowedRoles.includes(ROLES.RECEPTIONIST) || allowedRoles.includes(ROLES.OFFICE);

    const isUserReceptionOrOffice =
      userRole === ROLES.RECEPTIONIST || userRole === ROLES.OFFICE;

    if (allowedRoles.includes(userRole) || (isReceptionOrOfficeAllowed && isUserReceptionOrOffice)) {
      return next();
    }

    return res.status(403).json({
      STATUS: 'FAILED',
      StatusCode: '403',
      Message:
        deniedMessage ||
        `Access denied. Role '${userRole}' does not have sufficient permissions for this operation.`,
    });
  };
};
