// Frontend permission utilities

// Permission konstantalari (backend bilan bir xil)
export const PERMISSIONS = {
  // Companies
  VIEW_COMPANIES: 'view_companies',
  CREATE_COMPANIES: 'create_companies',
  EDIT_COMPANIES: 'edit_companies',
  DELETE_COMPANIES: 'delete_companies',
  
  // Districts  
  VIEW_DISTRICTS: 'view_districts',
  CREATE_DISTRICTS: 'create_districts',
  EDIT_DISTRICTS: 'edit_districts',
  DELETE_DISTRICTS: 'delete_districts',
  
  // Users
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  
  // Vehicles
  VIEW_VEHICLES: 'view_vehicles',
  CREATE_VEHICLES: 'create_vehicles',
  EDIT_VEHICLES: 'edit_vehicles',
  DELETE_VEHICLES: 'delete_vehicles',
  
  // Daily Work Status
  VIEW_DAILY_WORK: 'view_daily_work',
  INPUT_DAILY_WORK: 'input_daily_work',
  CONFIRM_DAILY_WORK: 'confirm_daily_work',
  EDIT_DAILY_WORK: 'edit_daily_work',
  
  // Reports
  VIEW_REPORTS: 'view_reports',
  EXPORT_REPORTS: 'export_reports',
  
  // Work Status Reasons
  VIEW_WORK_REASONS: 'view_work_reasons',
  MANAGE_WORK_REASONS: 'manage_work_reasons'
};

// Role-specific permissions (frontend copy)
const ROLE_PERMISSIONS = {
  super_admin: {
    [PERMISSIONS.VIEW_COMPANIES]: true,
    [PERMISSIONS.CREATE_COMPANIES]: true,
    [PERMISSIONS.EDIT_COMPANIES]: true,
    [PERMISSIONS.DELETE_COMPANIES]: true,
    [PERMISSIONS.VIEW_DISTRICTS]: true,
    [PERMISSIONS.CREATE_DISTRICTS]: true,
    [PERMISSIONS.EDIT_DISTRICTS]: true,
    [PERMISSIONS.DELETE_DISTRICTS]: true,
    [PERMISSIONS.VIEW_USERS]: true,
    [PERMISSIONS.CREATE_USERS]: true,
    [PERMISSIONS.EDIT_USERS]: true,
    [PERMISSIONS.DELETE_USERS]: true,
    [PERMISSIONS.VIEW_VEHICLES]: true,
    [PERMISSIONS.CREATE_VEHICLES]: true,
    [PERMISSIONS.EDIT_VEHICLES]: true,
    [PERMISSIONS.DELETE_VEHICLES]: true,
    [PERMISSIONS.VIEW_DAILY_WORK]: true,
    [PERMISSIONS.INPUT_DAILY_WORK]: true,
    [PERMISSIONS.CONFIRM_DAILY_WORK]: true,
    [PERMISSIONS.EDIT_DAILY_WORK]: true,
    [PERMISSIONS.VIEW_REPORTS]: true,
    [PERMISSIONS.EXPORT_REPORTS]: true,
    [PERMISSIONS.VIEW_WORK_REASONS]: true,
    [PERMISSIONS.MANAGE_WORK_REASONS]: true
  },
  
  company_admin: {
    [PERMISSIONS.VIEW_COMPANIES]: true,
    [PERMISSIONS.VIEW_DISTRICTS]: true,
    [PERMISSIONS.EDIT_DISTRICTS]: true,
    [PERMISSIONS.VIEW_USERS]: true,
    [PERMISSIONS.CREATE_USERS]: true,
    [PERMISSIONS.EDIT_USERS]: true,
    [PERMISSIONS.VIEW_VEHICLES]: true,
    [PERMISSIONS.CREATE_VEHICLES]: true,
    [PERMISSIONS.EDIT_VEHICLES]: true,
    [PERMISSIONS.VIEW_DAILY_WORK]: true,
    [PERMISSIONS.INPUT_DAILY_WORK]: true,
    [PERMISSIONS.CONFIRM_DAILY_WORK]: true,
    [PERMISSIONS.EDIT_DAILY_WORK]: true,
    [PERMISSIONS.VIEW_REPORTS]: true,
    [PERMISSIONS.EXPORT_REPORTS]: true,
    [PERMISSIONS.VIEW_WORK_REASONS]: true,
    [PERMISSIONS.MANAGE_WORK_REASONS]: true
  },
  
  district_manager: {
    [PERMISSIONS.VIEW_COMPANIES]: true,
    [PERMISSIONS.VIEW_DISTRICTS]: true,
    [PERMISSIONS.VIEW_USERS]: true,
    [PERMISSIONS.VIEW_VEHICLES]: true,
    [PERMISSIONS.EDIT_VEHICLES]: true,
    [PERMISSIONS.VIEW_DAILY_WORK]: true,
    [PERMISSIONS.INPUT_DAILY_WORK]: true,
    [PERMISSIONS.CONFIRM_DAILY_WORK]: true,
    [PERMISSIONS.VIEW_REPORTS]: true,
    [PERMISSIONS.VIEW_WORK_REASONS]: true
  },
  
  operator: {
    [PERMISSIONS.VIEW_COMPANIES]: true,
    [PERMISSIONS.VIEW_DISTRICTS]: true,
    [PERMISSIONS.VIEW_VEHICLES]: true,
    [PERMISSIONS.VIEW_DAILY_WORK]: true,
    [PERMISSIONS.INPUT_DAILY_WORK]: true,
    [PERMISSIONS.VIEW_WORK_REASONS]: true
  },
  
  driver: {
    [PERMISSIONS.VIEW_VEHICLES]: true,
    [PERMISSIONS.VIEW_DAILY_WORK]: true
  }
};

// Permission tekshirish funksiyasi
export const hasPermission = (user, permission) => {
  if (!user || !user.role) {
    return false;
  }
  
  // Super admin uchun barcha ruxsatlar
  if (user.role.name === 'super_admin') {
    return true;
  }
  
  // Role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[user.role.name] || {};
  if (rolePermissions[permission]) {
    return true;
  }
  
  // Custom permissions (database'dan)
  const customPermissions = user.role.permissions || {};
  if (customPermissions[permission]) {
    return true;
  }
  
  // User-specific permissions
  const userPermissions = user.custom_permissions || {};
  if (userPermissions[permission]) {
    return true;
  }
  
  return false;
};

// Company access tekshirish
export const hasCompanyAccess = (user, companyId) => {
  if (!companyId) return true;
  
  if (user?.role?.name === 'super_admin') {
    return true;
  }
  
  return user?.company_id === parseInt(companyId);
};

// District access tekshirish
export const hasDistrictAccess = (user, districtId) => {
  if (!districtId) return true;
  
  if (user?.role?.name === 'super_admin') {
    return true;
  }
  
  if (user?.role?.name === 'company_admin') {
    return true; // Company admin o'z korxonasi tumanlarini ko'ra oladi
  }
  
  if (user?.role?.name === 'operator') {
    const userDistrictAccess = user?.district_access || [];
    return userDistrictAccess.includes(parseInt(districtId));
  }
  
  return false;
};

// Role hierarchy tekshirish
export const isHigherRole = (userRole, targetRole) => {
  const roleHierarchy = {
    'super_admin': 5,
    'company_admin': 4,
    'district_manager': 3,
    'operator': 2,
    'driver': 1
  };
  
  const userLevel = roleHierarchy[userRole] || 0;
  const targetLevel = roleHierarchy[targetRole] || 0;
  
  return userLevel > targetLevel;
};

// User permissions ro'yxati
export const getUserPermissions = (user) => {
  if (!user || !user.role) {
    return [];
  }
  
  const rolePermissions = ROLE_PERMISSIONS[user.role.name] || {};
  const customPermissions = user.role.permissions || {};
  const userPermissions = user.custom_permissions || {};
  
  const allPermissions = {
    ...rolePermissions,
    ...customPermissions,
    ...userPermissions
  };
  
  return Object.keys(allPermissions).filter(permission => allPermissions[permission]);
};

// Rol nomi formatini yaxshilash
export const formatRoleName = (roleName) => {
  const roleNames = {
    'super_admin': 'Super Administrator',
    'company_admin': 'Korxona Administratori',
    'district_manager': 'Tuman Menejeri',
    'operator': 'Operator',
    'driver': 'Haydovchi'
  };
  
  return roleNames[roleName] || roleName;
};

// Permission GuardComponent
export const PermissionGuard = ({ children, permission, user, fallback = null }) => {
  if (!hasPermission(user, permission)) {
    return fallback;
  }
  
  return children;
};

// Role GuardComponent
export const RoleGuard = ({ children, allowedRoles, user, fallback = null }) => {
  if (!user || !user.role || !allowedRoles.includes(user.role.name)) {
    return fallback;
  }
  
  return children;
};

const permissionUtils = {
  PERMISSIONS,
  hasPermission,
  hasCompanyAccess,
  hasDistrictAccess,
  isHigherRole,
  getUserPermissions,
  formatRoleName,
  PermissionGuard,
  RoleGuard
};

export default permissionUtils;
