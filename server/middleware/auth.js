const jwt = require('jsonwebtoken');
const { User, Role, Company } = require('../models');

// JWT token yaratish
const generateToken = (userId) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'waste_management_super_secret_key_2024_uzbekistan_system_12345';
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// JWT token tekshirish middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token berilmagan'
      });
    }
    
    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET || 'waste_management_super_secret_key_2024_uzbekistan_system_12345';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findByPk(decoded.userId, {
      include: [
        {
          model: Role,
          as: 'role'
        },
        {
          model: Company,
          as: 'company'
        }
      ]
    });
    
    if (!user) {
      return res.status(401).json({
        error: 'Foydalanuvchi topilmadi'
      });
    }
    
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Foydalanuvchi faol emas'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware xatoligi:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Yaroqsiz token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token muddati tugagan'
      });
    }
    
    return res.status(500).json({
      error: 'Autentifikatsiya xatoligi'
    });
  }
};

// Ruxsatlarni tekshirish middleware
const authorize = (permissions = []) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        error: 'Ruxsat yo\'q - rol belgilanmagan'
      });
    }
    
    const userPermissions = req.user.role.permissions || {};
    
    // Super admin uchun barcha ruxsatlar
    if (req.user.role.name === 'super_admin') {
      return next();
    }
    
    // Kerakli ruxsatlarni tekshirish
    for (let permission of permissions) {
      if (!userPermissions[permission]) {
        return res.status(403).json({
          error: `Ruxsat yo'q - ${permission} kerak`
        });
      }
    }
    
    next();
  };
};

// Korxona/tuman ruxsatlarini tekshirish
const checkDistrictAccess = (req, res, next) => {
  const districtId = req.params.districtId || req.body.district_id || req.query.district_id;
  
  if (!districtId) {
    return next(); // Agar tuman ID berilmagan bo'lsa, davom et
  }
  
  // Super admin uchun barcha tumanlar ruxsat
  if (req.user.role.name === 'super_admin') {
    return next();
  }
  
  // Company admin o'z korxonasi tumanlarini ko'ra oladi
  if (req.user.role.name === 'company_admin') {
    return next(); // District filtering DB level'da amalga oshiriladi
  }
  
  // Operator faqat o'z tumani
  if (req.user.role.name === 'operator') {
    const userDistrictAccess = req.user.district_access || [];
    if (!userDistrictAccess.includes(parseInt(districtId))) {
      return res.status(403).json({
        error: 'Bu tumanga ruxsat yo\'q'
      });
    }
  }
  
  next();
};

// Korxona ruxsatlarini tekshirish
const checkCompanyAccess = (req, res, next) => {
  const companyId = req.params.companyId || req.body.company_id || req.query.company_id;
  
  if (!companyId) {
    return next();
  }
  
  // Super admin uchun barcha korxonalar ruxsat
  if (req.user.role.name === 'super_admin') {
    return next();
  }
  
  // Company admin faqat o'z korxonasi
  if (req.user.role.name === 'company_admin' || req.user.role.name === 'operator') {
    if (req.user.company_id !== parseInt(companyId)) {
      return res.status(403).json({
        error: 'Bu korxonaga ruxsat yo\'q'
      });
    }
  }
  
  next();
};

// Data filtering helper - korxona va tuman bo'yicha
const applyDataFiltering = (user, whereClause = {}) => {
  // Super admin hamma narsani ko'radi
  if (user.role.name === 'super_admin') {
    return whereClause;
  }
  
  // Company admin faqat o'z korxonasi
  if (user.role.name === 'company_admin') {
    whereClause.company_id = user.company_id;
    return whereClause;
  }
  
  // Operator faqat o'z tumani
  if (user.role.name === 'operator' && user.district_access?.length > 0) {
    whereClause.district_id = { [require('sequelize').Op.in]: user.district_access };
    if (user.company_id) {
      whereClause.company_id = user.company_id;
    }
    return whereClause;
  }
  
  return whereClause;
};

module.exports = {
  generateToken,
  authenticate,
  authorize,
  checkDistrictAccess,
  checkCompanyAccess,
  applyDataFiltering
};
