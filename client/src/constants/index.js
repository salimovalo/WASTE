// Application constants
export const DEFAULTS = {
  // Vehicle defaults
  ODOMETER_START: 10000,
  SPEEDOMETER_START: 10000,
  FUEL_START: 50,
  
  // API timeouts
  API_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  
  // Pagination
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Date formats
  DATE_FORMAT: 'DD.MM.YYYY',
  DATETIME_FORMAT: 'DD.MM.YYYY HH:mm',
  TIME_FORMAT: 'HH:mm',
  
  // File upload
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  
  // Cache
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  
  // Validation
  MIN_PASSWORD_LENGTH: 6,
  MAX_TEXT_LENGTH: 1000,
  
  // Colors
  COLORS: {
    PRIMARY: '#1890ff',
    SUCCESS: '#52c41a',
    WARNING: '#faad14',
    ERROR: '#ff4d4f',
    INFO: '#1890ff'
  }
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password'
  },
  USERS: '/users',
  COMPANIES: '/companies',
  DISTRICTS: '/districts',
  NEIGHBORHOODS: '/neighborhoods',
  VEHICLES: '/vehicles',
  EMPLOYEES: '/employees',
  TRIP_SHEETS: '/trip-sheets',
  REPORTS: '/reports',
  FUEL_STATIONS: '/fuel-stations',
  POLYGONS: '/polygons',
  WEATHER: '/weather'
};

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  COMPANY_ADMIN: 'company_admin', 
  DISTRICT_MANAGER: 'district_manager',
  OPERATOR: 'operator',
  DRIVER: 'driver'
};

export const VEHICLE_TYPES = {
  GARBAGE_TRUCK: 'garbage_truck',
  CONTAINER_TRUCK: 'container_truck',
  COMPACTOR: 'compactor',
  SWEEPER: 'sweeper'
};

export const FUEL_TYPES = {
  DIESEL: 'diesel',
  GASOLINE: 'gasoline',
  GAS: 'gas',
  ELECTRIC: 'electric'
};

export const WORK_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
  REPAIR: 'repair'
};

export const COMPLAINT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

export const NEIGHBORHOOD_TYPES = {
  APARTMENT_COMPLEX: 'apartment_complex',
  PRIVATE_HOUSES: 'private_houses',
  MIXED: 'mixed'
};

// Uzbek translations
export const TRANSLATIONS = {
  [USER_ROLES.SUPER_ADMIN]: 'Super Administrator',
  [USER_ROLES.COMPANY_ADMIN]: 'Korxona Administratori',
  [USER_ROLES.DISTRICT_MANAGER]: 'Tuman Menejeri',
  [USER_ROLES.OPERATOR]: 'Operator',
  [USER_ROLES.DRIVER]: 'Haydovchi',
  
  [VEHICLE_TYPES.GARBAGE_TRUCK]: 'Chiqindi yuk mashinasi',
  [VEHICLE_TYPES.CONTAINER_TRUCK]: 'Konteyner mashinasi',
  [VEHICLE_TYPES.COMPACTOR]: 'Siquvchi mashina',
  [VEHICLE_TYPES.SWEEPER]: 'Supuruvchi mashina',
  
  [FUEL_TYPES.DIESEL]: 'Dizel',
  [FUEL_TYPES.GASOLINE]: 'Benzin',
  [FUEL_TYPES.GAS]: 'Gaz',
  [FUEL_TYPES.ELECTRIC]: 'Elektr',
  
  [WORK_STATUS.ACTIVE]: 'Faol',
  [WORK_STATUS.INACTIVE]: 'Faol emas',
  [WORK_STATUS.MAINTENANCE]: 'Texnik xizmat',
  [WORK_STATUS.REPAIR]: 'Ta\'mirlash',
  
  [COMPLAINT_STATUS.OPEN]: 'Ochiq',
  [COMPLAINT_STATUS.IN_PROGRESS]: 'Jarayonda',
  [COMPLAINT_STATUS.RESOLVED]: 'Hal qilindi',
  [COMPLAINT_STATUS.CLOSED]: 'Yopildi',
  
  [NEIGHBORHOOD_TYPES.APARTMENT_COMPLEX]: 'Ko\'p qavatli uylar',
  [NEIGHBORHOOD_TYPES.PRIVATE_HOUSES]: 'Xususiy uylar',
  [NEIGHBORHOOD_TYPES.MIXED]: 'Aralash'
};

export const VALIDATION_RULES = {
  REQUIRED: 'Bu maydon to\'ldirilishi shart',
  EMAIL: 'Email manzil noto\'g\'ri formatda',
  PHONE: 'Telefon raqam noto\'g\'ri formatda',
  MIN_LENGTH: (min) => `Kamida ${min} ta belgi bo\'lishi kerak`,
  MAX_LENGTH: (max) => `Ko\'pi bilan ${max} ta belgi bo\'lishi mumkin`,
  POSITIVE_NUMBER: 'Musbat son bo\'lishi kerak',
  FUTURE_DATE: 'Kelajakdagi sana bo\'lishi mumkin emas'
};

export const SUCCESS_MESSAGES = {
  CREATED: 'Muvaffaqiyatli yaratildi',
  UPDATED: 'Muvaffaqiyatli yangilandi', 
  DELETED: 'Muvaffaqiyatli o\'chirildi',
  SAVED: 'Saqlandi',
  UPLOADED: 'Yuklandi',
  SENT: 'Yuborildi'
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Tarmoq xatoligi. Internetga ulanishni tekshiring.',
  SERVER_ERROR: 'Server xatoligi. Keyinroq urinib ko\'ring.',
  UNAUTHORIZED: 'Tizimga kirishingiz kerak',
  FORBIDDEN: 'Bu amalni bajarish uchun ruxsatingiz yo\'q',
  NOT_FOUND: 'Ma\'lumot topilmadi',
  VALIDATION_ERROR: 'Ma\'lumotlar to\'g\'ri emas',
  FILE_TOO_LARGE: 'Fayl hajmi juda katta',
  INVALID_FILE_TYPE: 'Fayl turi qo\'llab-quvvatlanmaydi'
};
