-- Chiqindilarni boshqarish tizimi ma'lumotlar bazasi sxemasi

-- Korxonalar jadvali
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    inn VARCHAR(9) NOT NULL UNIQUE,
    bank_account VARCHAR(20),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    director_name VARCHAR(255),
    license_number VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tumanlar jadvali
CREATE TABLE districts (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    region VARCHAR(100),
    population INTEGER,
    area_km2 DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, code)
);

-- Maxallalar jadvali
CREATE TABLE neighborhoods (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES districts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    type ENUM('apartment_complex', 'private_houses', 'mixed') DEFAULT 'mixed',
    households_count INTEGER DEFAULT 0,
    population INTEGER DEFAULT 0,
    collection_days VARCHAR(20), -- 'mon,wed,fri' yoki 'daily'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(district_id, code)
);

-- Foydalanuvchi rollari
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Foydalanuvchilar jadvali
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    phone VARCHAR(20),
    role_id INTEGER REFERENCES roles(id),
    company_id INTEGER REFERENCES companies(id),
    district_access JSONB DEFAULT '[]', -- ruxsat berilgan tumanlar ID lari
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jismoniy shaxslar kunlik ma'lumotlari
CREATE TABLE daily_household_collection (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES districts(id) ON DELETE CASCADE,
    neighborhood_id INTEGER REFERENCES neighborhoods(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    planned_households INTEGER DEFAULT 0,
    actual_households INTEGER DEFAULT 0,
    planned_volume_m3 DECIMAL(10,2) DEFAULT 0,
    actual_volume_m3 DECIMAL(10,2) DEFAULT 0,
    planned_revenue DECIMAL(12,2) DEFAULT 0,
    actual_revenue DECIMAL(12,2) DEFAULT 0,
    operator_id INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(district_id, neighborhood_id, date)
);

-- Yuridik shaxslar
CREATE TABLE legal_entities (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    district_id INTEGER REFERENCES districts(id),
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50) NOT NULL UNIQUE,
    legal_address TEXT,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(150),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shartnoma turlari
CREATE TABLE contract_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_container_based BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true
);

-- Shartnomalar
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    contract_number VARCHAR(100) NOT NULL UNIQUE,
    legal_entity_id INTEGER REFERENCES legal_entities(id) ON DELETE CASCADE,
    contract_type_id INTEGER REFERENCES contract_types(id),
    start_date DATE NOT NULL,
    end_date DATE,
    monthly_volume_m3 DECIMAL(10,2),
    price_per_m3 DECIMAL(10,2),
    monthly_fixed_price DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    signed_at DATE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Yuridik shaxslar uchun kunlik xizmat
CREATE TABLE daily_legal_collection (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    volume_m3 DECIMAL(10,2) DEFAULT 0,
    receipt_number VARCHAR(100),
    vehicle_id INTEGER,
    driver_id INTEGER REFERENCES users(id),
    operator_id INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contract_id, date, receipt_number)
);

-- Transport vositalari
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    district_id INTEGER REFERENCES districts(id),
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    vehicle_type VARCHAR(50), -- 'garbage_truck', 'container_truck', etc.
    brand VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    capacity_m3 DECIMAL(8,2),
    fuel_type VARCHAR(20), -- 'diesel', 'gasoline', 'gas'
    fuel_consumption_per_100km DECIMAL(5,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kunlik transport ishlari
CREATE TABLE daily_vehicle_operations (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    driver_id INTEGER REFERENCES users(id),
    start_mileage INTEGER,
    end_mileage INTEGER,
    fuel_consumed_liters DECIMAL(8,2),
    fuel_cost DECIMAL(10,2),
    trips_count INTEGER DEFAULT 0,
    total_volume_collected_m3 DECIMAL(10,2) DEFAULT 0,
    working_hours DECIMAL(4,2) DEFAULT 0,
    operator_id INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vehicle_id, date)
);

-- Xizmat sifati baholari
CREATE TABLE service_quality_assessments (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES districts(id),
    neighborhood_id INTEGER REFERENCES neighborhoods(id),
    date DATE NOT NULL,
    cleanliness_score INTEGER CHECK (cleanliness_score >= 1 AND cleanliness_score <= 5),
    timeliness_score INTEGER CHECK (timeliness_score >= 1 AND timeliness_score <= 5),
    coverage_percentage DECIMAL(5,2) DEFAULT 100,
    complaints_count INTEGER DEFAULT 0,
    assessor_id INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(district_id, neighborhood_id, date)
);

-- Shikoyatlar
CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES districts(id),
    neighborhood_id INTEGER REFERENCES neighborhoods(id),
    complaint_type VARCHAR(100), -- 'missed_collection', 'poor_quality', 'damage'
    description TEXT NOT NULL,
    reporter_name VARCHAR(255),
    reporter_phone VARCHAR(20),
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    assigned_to INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Xodimlar KPI
CREATE TABLE employee_kpi (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    planned_collections INTEGER DEFAULT 0,
    actual_collections INTEGER DEFAULT 0,
    planned_volume_m3 DECIMAL(10,2) DEFAULT 0,
    actual_volume_m3 DECIMAL(10,2) DEFAULT 0,
    efficiency_percentage DECIMAL(5,2) DEFAULT 0,
    quality_score DECIMAL(3,1) DEFAULT 0,
    complaints_received INTEGER DEFAULT 0,
    evaluator_id INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, month, year)
);

-- Tizim parametrlari
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    data_type VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log - barcha o'zgarishlarni kuzatish
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    user_id INTEGER REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indekslar tezlik uchun
CREATE INDEX idx_daily_household_date ON daily_household_collection(date);
CREATE INDEX idx_daily_household_district ON daily_household_collection(district_id);
CREATE INDEX idx_daily_legal_date ON daily_legal_collection(date);
CREATE INDEX idx_daily_legal_contract ON daily_legal_collection(contract_id);
CREATE INDEX idx_vehicles_company ON vehicles(company_id);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_districts_company ON districts(company_id);
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_date ON audit_log(created_at);

-- Ma'lumotlar yaxlitligi uchun constraint'lar
ALTER TABLE daily_household_collection 
ADD CONSTRAINT chk_positive_volumes 
CHECK (planned_volume_m3 >= 0 AND actual_volume_m3 >= 0);

ALTER TABLE daily_household_collection 
ADD CONSTRAINT chk_positive_revenue 
CHECK (planned_revenue >= 0 AND actual_revenue >= 0);

ALTER TABLE contracts 
ADD CONSTRAINT chk_positive_prices 
CHECK (price_per_m3 >= 0 AND monthly_fixed_price >= 0);

ALTER TABLE daily_legal_collection 
ADD CONSTRAINT chk_positive_volume 
CHECK (volume_m3 >= 0);
