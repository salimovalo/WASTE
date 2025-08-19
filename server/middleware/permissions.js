const { Role } = require('../models');

// Permission konstantalari
const PERMISSIONS = {
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

// Role-specific permissions
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
    [PERMISSIONS.VIEW_COMPANIES]: true, // faqat o'z korxonasi
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
    [PERMISSIONS.VIEW_COMPANIES]: true, // faqat o'z korxonasi
    [PERMISSIONS.VIEW_DISTRICTS]: true, // faqat o'z tumani
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
    [PERMISSIONS.VIEW_COMPANIES]: true, // faqat o'z korxonasi
    [PERMISSIONS.VIEW_DISTRICTS]: true, // faqat o'z tumani
    [PERMISSIONS.VIEW_VEHICLES]: true, // faqat o'z tumani
    [PERMISSIONS.VIEW_DAILY_WORK]: true,
    [PERMISSIONS.INPUT_DAILY_WORK]: true,
    [PERMISSIONS.VIEW_WORK_REASONS]: true
  },
  
  driver: {
    [PERMISSIONS.VIEW_VEHICLES]: true, // faqat tayinlangan texnika
    [PERMISSIONS.VIEW_DAILY_WORK]: true // faqat o'z texnikasi
  }
};

// Permission tekshirish funksiyasi
const hasPermission = (user, permission) => {
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
const hasCompanyAccess = (user, companyId) => {
  if (!companyId) return true;
  
  if (user.role.name === 'super_admin') {
    return true;
  }
  
  return user.company_id === parseInt(companyId);
};

// District access tekshirish
const hasDistrictAccess = (user, districtId) => {
  if (!districtId) return true;
  
  if (user.role.name === 'super_admin') {
    return true;
  }
  
  if (user.role.name === 'company_admin') {
    return true; // Company admin o'z korxonasi tumanlarini ko'ra oladi
  }
  
  if (user.role.name === 'operator') {
    const userDistrictAccess = user.district_access || [];
    return userDistrictAccess.includes(parseInt(districtId));
  }
  
  return false;
};

// Role hierarchy tekshirish
const isHigherRole = (userRole, targetRole) => {
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

// Middleware: Permission tekshirish
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Autentifikatsiya talab qilinadi'
      });
    }
    
    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({
        error: `Ruxsat yo'q - ${permission} kerak`,
        required_permission: permission,
        user_role: req.user.role?.name
      });
    }
    
    next();
  };
};

// Middleware: Company access tekshirish
const requireCompanyAccess = (req, res, next) => {
  const companyId = req.params.companyId || req.body.company_id || req.query.company_id;
  
  if (!hasCompanyAccess(req.user, companyId)) {
    return res.status(403).json({
      error: 'Bu korxonaga ruxsat yo\'q',
      user_company: req.user.company_id,
      requested_company: companyId
    });
  }
  
  next();
};

// Middleware: District access tekshirish
const requireDistrictAccess = (req, res, next) => {
  const districtId = req.params.districtId || req.body.district_id || req.query.district_id;
  
  if (!hasDistrictAccess(req.user, districtId)) {
    return res.status(403).json({
      error: 'Bu tumanga ruxsat yo\'q',
      user_districts: req.user.district_access,
      requested_district: districtId
    });
  }
  
  next();
};

// Utility: User permissions ro'yxati
const getUserPermissions = (user) => {
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

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasCompanyAccess,
  hasDistrictAccess,
  isHigherRole,
  requirePermission,
  requireCompanyAccess,
  requireDistrictAccess,
  getUserPermissions
};
