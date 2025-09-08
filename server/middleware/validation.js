const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Ma\'lumotlar to\'g\'ri emas',
      details: errorMessages
    });
  }
  
  next();
};

// Common validation rules
const commonValidations = {
  // ID validation
  id: param('id').isInt({ min: 1 }).withMessage('ID musbat butun son bo\'lishi kerak'),
  
  // String validations
  name: body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nom 2-255 belgi orasida bo\'lishi kerak')
    .matches(/^[a-zA-Z0-9\s\u0400-\u04FF\u0600-\u06FF]+$/)
    .withMessage('Nom faqat harflar, raqamlar va bo\'shliqdan iborat bo\'lishi mumkin'),
    
  // Email validation
  email: body('email')
    .optional()
    .isEmail()
    .withMessage('Email manzil noto\'g\'ri formatda')
    .normalizeEmail(),
    
  // Phone validation
  phone: body('phone')
    .optional()
    .matches(/^[\+]?[0-9\-\(\)\s]{9,20}$/)
    .withMessage('Telefon raqam noto\'g\'ri formatda'),
    
  // Password validation
  password: body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Parol 6-100 belgi orasida bo\'lishi kerak')
    .matches(/^(?=.*[a-zA-Z])(?=.*[0-9])/)
    .withMessage('Parol kamida bitta harf va raqam o\'z ichiga olishi kerak'),
    
  // Username validation
  username: body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Foydalanuvchi nomi 3-50 belgi orasida bo\'lishi kerak')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Foydalanuvchi nomida faqat harflar, raqamlar va pastki chiziq bo\'lishi mumkin'),
    
  // Date validation
  date: body('date')
    .isISO8601()
    .withMessage('Sana noto\'g\'ri formatda')
    .toDate(),
    
  // Boolean validation
  isActive: body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active boolean qiymat bo\'lishi kerak'),
    
  // Number validations
  positiveNumber: (field) => body(field)
    .isFloat({ min: 0 })
    .withMessage(`${field} musbat son bo\'lishi kerak`),
    
  positiveInteger: (field) => body(field)
    .isInt({ min: 0 })
    .withMessage(`${field} musbat butun son bo\'lishi kerak`),
    
  // Array validation
  arrayOfIntegers: (field) => body(field)
    .isArray()
    .withMessage(`${field} massiv bo\'lishi kerak`)
    .custom((value) => {
      if (!Array.isArray(value)) return false;
      return value.every(item => Number.isInteger(item) && item > 0);
    })
    .withMessage(`${field} musbat butun sonlar massivi bo\'lishi kerak`)
};

// Specific entity validations
const userValidation = {
  create: [
    commonValidations.username,
    commonValidations.email,
    commonValidations.password,
    body('first_name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Ism 1-100 belgi orasida bo\'lishi kerak'),
    body('last_name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Familiya 1-100 belgi orasida bo\'lishi kerak'),
    body('role_id')
      .isInt({ min: 1 })
      .withMessage('Rol ID si musbat butun son bo\'lishi kerak'),
    commonValidations.phone,
    commonValidations.isActive,
    validate
  ],
  
  update: [
    commonValidations.id,
    body('first_name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Ism 1-100 belgi orasida bo\'lishi kerak'),
    body('last_name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Familiya 1-100 belgi orasida bo\'lishi kerak'),
    commonValidations.email,
    commonValidations.phone,
    commonValidations.isActive,
    validate
  ]
};

const companyValidation = {
  create: [
    commonValidations.name,
    body('code')
      .trim()
      .isLength({ min: 2, max: 10 })
      .withMessage('Kod 2-10 belgi orasida bo\'lishi kerak')
      .matches(/^[A-Z0-9]+$/)
      .withMessage('Kod faqat katta harflar va raqamlardan iborat bo\'lishi mumkin'),
    body('inn')
      .matches(/^[0-9]{9}$/)
      .withMessage('INN 9 ta raqamdan iborat bo\'lishi kerak'),
    commonValidations.email,
    commonValidations.phone,
    validate
  ],
  
  update: [
    commonValidations.id,
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('Nom 2-255 belgi orasida bo\'lishi kerak'),
    commonValidations.email,
    commonValidations.phone,
    commonValidations.isActive,
    validate
  ]
};

const vehicleValidation = {
  create: [
    body('plate_number')
      .trim()
      .isLength({ min: 6, max: 20 })
      .withMessage('Davlat raqami 6-20 belgi orasida bo\'lishi kerak')
      .matches(/^[A-Z0-9\s]+$/)
      .withMessage('Davlat raqami faqat katta harflar, raqamlar va bo\'shliqdan iborat bo\'lishi mumkin'),
    body('vehicle_type')
      .isIn(['garbage_truck', 'container_truck', 'compactor', 'sweeper'])
      .withMessage('Transport turi noto\'g\'ri'),
    body('fuel_type')
      .isIn(['diesel', 'gasoline', 'gas', 'electric'])
      .withMessage('Yoqilg\'i turi noto\'g\'ri'),
    commonValidations.positiveNumber('capacity_m3'),
    commonValidations.positiveNumber('fuel_consumption_per_100km'),
    body('year')
      .optional()
      .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
      .withMessage(`Yil 1990-${new Date().getFullYear() + 1} orasida bo\'lishi kerak`),
    validate
  ],
  
  update: [
    commonValidations.id,
    body('vehicle_type')
      .optional()
      .isIn(['garbage_truck', 'container_truck', 'compactor', 'sweeper'])
      .withMessage('Transport turi noto\'g\'ri'),
    body('fuel_type')
      .optional()
      .isIn(['diesel', 'gasoline', 'gas', 'electric'])
      .withMessage('Yoqilg\'i turi noto\'g\'ri'),
    commonValidations.isActive,
    validate
  ]
};

const tripSheetValidation = {
  create: [
    body('vehicle_id')
      .isInt({ min: 1 })
      .withMessage('Transport ID si musbat butun son bo\'lishi kerak'),
    commonValidations.date,
    body('driver_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Haydovchi ID si musbat butun son bo\'lishi kerak'),
    commonValidations.positiveInteger('odometer_start'),
    commonValidations.positiveInteger('odometer_end'),
    commonValidations.positiveNumber('fuel_taken'),
    commonValidations.positiveNumber('waste_volume_m3'),
    validate
  ],
  
  update: [
    commonValidations.id,
    commonValidations.positiveInteger('odometer_end'),
    commonValidations.positiveNumber('fuel_taken'),
    commonValidations.positiveNumber('waste_volume_m3'),
    validate
  ]
};

// Query parameter validations
const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Sahifa raqami musbat butun son bo\'lishi kerak'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit 1-100 orasida bo\'lishi kerak'),
    validate
  ],
  
  dateRange: [
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('Boshlanish sanasi noto\'g\'ri formatda'),
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('Tugash sanasi noto\'g\'ri formatda')
      .custom((value, { req }) => {
        if (req.query.start_date && value) {
          const startDate = new Date(req.query.start_date);
          const endDate = new Date(value);
          if (endDate < startDate) {
            throw new Error('Tugash sanasi boshlanish sanasidan keyinroq bo\'lishi kerak');
          }
        }
        return true;
      }),
    validate
  ]
};

// Error handling middleware
const handleValidationError = (error, req, res, next) => {
  if (error.name === 'SequelizeValidationError') {
    const validationErrors = error.errors.map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));
    
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Ma\'lumotlar validatsiyadan o\'tmadi',
      details: validationErrors
    });
  }
  
  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = error.errors[0]?.path;
    return res.status(400).json({
      error: 'Unique Constraint Error',
      message: `Bu ${field} allaqachon mavjud`,
      field: field
    });
  }
  
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: 'Foreign Key Error',
      message: 'Bog\'langan ma\'lumot topilmadi'
    });
  }
  
  next(error);
};

module.exports = {
  validate,
  commonValidations,
  userValidation,
  companyValidation,
  vehicleValidation,
  tripSheetValidation,
  queryValidation,
  handleValidationError
};
