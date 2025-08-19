const { sequelize } = require('../config/database');

// Barcha modellarni import qilish
const Company = require('./Company');
const District = require('./District');
const Role = require('./Role');
const User = require('./User');
const Neighborhood = require('./Neighborhood');
const LegalEntity = require('./LegalEntity');
const Contract = require('./Contract');
const Vehicle = require('./Vehicle');
const VehicleDailyData = require('./VehicleDailyData');
const VehicleFuelRecord = require('./VehicleFuelRecord');
const FuelStation = require('./FuelStation');
const DistrictFuelStation = require('./DistrictFuelStation');
const WorkStatusReason = require('./WorkStatusReason');
const VehicleWorkStatus = require('./VehicleWorkStatus');

// Bog'lanishlarni o'rnatish

// Company → Districts (One-to-Many)
Company.hasMany(District, {
  foreignKey: 'company_id',
  as: 'districts',
  onDelete: 'SET NULL'
});
District.belongsTo(Company, {
  foreignKey: 'company_id',
  as: 'company'
});

// District → Neighborhoods (One-to-Many)
District.hasMany(Neighborhood, {
  foreignKey: 'district_id',
  as: 'neighborhoods',
  onDelete: 'CASCADE'
});
Neighborhood.belongsTo(District, {
  foreignKey: 'district_id',
  as: 'district'
});

// Role → Users (One-to-Many)
Role.hasMany(User, {
  foreignKey: 'role_id',
  as: 'users'
});
User.belongsTo(Role, {
  foreignKey: 'role_id',
  as: 'role'
});

// Company → Users (One-to-Many)
Company.hasMany(User, {
  foreignKey: 'company_id',
  as: 'users',
  onDelete: 'SET NULL'
});
User.belongsTo(Company, {
  foreignKey: 'company_id',
  as: 'company'
});

// Company → LegalEntities (One-to-Many)
Company.hasMany(LegalEntity, {
  foreignKey: 'company_id',
  as: 'legal_entities'
});
LegalEntity.belongsTo(Company, {
  foreignKey: 'company_id',
  as: 'company'
});

// District → LegalEntities (One-to-Many)
District.hasMany(LegalEntity, {
  foreignKey: 'district_id',
  as: 'legal_entities'
});
LegalEntity.belongsTo(District, {
  foreignKey: 'district_id',
  as: 'district'
});

// LegalEntity → Contracts (One-to-Many)
LegalEntity.hasMany(Contract, {
  foreignKey: 'legal_entity_id',
  as: 'contracts',
  onDelete: 'CASCADE'
});
Contract.belongsTo(LegalEntity, {
  foreignKey: 'legal_entity_id',
  as: 'legal_entity'
});

// User → Contracts (One-to-Many) - kim yaratgan
User.hasMany(Contract, {
  foreignKey: 'created_by',
  as: 'created_contracts'
});
Contract.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

// Company → Vehicles (One-to-Many)
Company.hasMany(Vehicle, {
  foreignKey: 'company_id',
  as: 'vehicles'
});
Vehicle.belongsTo(Company, {
  foreignKey: 'company_id',
  as: 'company'
});

// District → Vehicles (One-to-Many)
District.hasMany(Vehicle, {
  foreignKey: 'district_id',
  as: 'vehicles'
});
Vehicle.belongsTo(District, {
  foreignKey: 'district_id',
  as: 'district'
});

// Vehicle → VehicleDailyData (One-to-Many)
Vehicle.hasMany(VehicleDailyData, {
  foreignKey: 'vehicle_id',
  as: 'daily_data',
  onDelete: 'CASCADE'
});
VehicleDailyData.belongsTo(Vehicle, {
  foreignKey: 'vehicle_id',
  as: 'vehicle'
});

// Vehicle → VehicleFuelRecord (One-to-Many)
Vehicle.hasMany(VehicleFuelRecord, {
  foreignKey: 'vehicle_id',
  as: 'fuel_records',
  onDelete: 'CASCADE'
});
VehicleFuelRecord.belongsTo(Vehicle, {
  foreignKey: 'vehicle_id',
  as: 'vehicle'
});

// User → VehicleDailyData (One-to-Many) - kim yaratgan
User.hasMany(VehicleDailyData, {
  foreignKey: 'created_by',
  as: 'created_daily_data'
});
VehicleDailyData.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

// User → VehicleFuelRecord (One-to-Many) - kim yaratgan
User.hasMany(VehicleFuelRecord, {
  foreignKey: 'created_by',
  as: 'created_fuel_records'
});
VehicleFuelRecord.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

// User → VehicleFuelRecord (One-to-Many) - kim tasdiqlagan
User.hasMany(VehicleFuelRecord, {
  foreignKey: 'approved_by',
  as: 'approved_fuel_records'
});
VehicleFuelRecord.belongsTo(User, {
  foreignKey: 'approved_by',
  as: 'approver'
});

// FuelStation → VehicleFuelRecord (One-to-Many)
FuelStation.hasMany(VehicleFuelRecord, {
  foreignKey: 'fuel_station_id',
  as: 'fuel_records',
  onDelete: 'SET NULL'
});
VehicleFuelRecord.belongsTo(FuelStation, {
  foreignKey: 'fuel_station_id',
  as: 'fuel_station'
});

// Company → FuelStations (One-to-Many)
Company.hasMany(FuelStation, {
  foreignKey: 'company_id',
  as: 'fuel_stations'
});
FuelStation.belongsTo(Company, {
  foreignKey: 'company_id',
  as: 'company'
});

// District va FuelStation o'rtasida Many-to-Many munosabat
District.belongsToMany(FuelStation, {
  through: DistrictFuelStation,
  foreignKey: 'district_id',
  otherKey: 'fuel_station_id',
  as: 'fuel_stations'
});
FuelStation.belongsToMany(District, {
  through: DistrictFuelStation,
  foreignKey: 'fuel_station_id',
  otherKey: 'district_id',
  as: 'districts'
});

// DistrictFuelStation bog'lanishlari
District.hasMany(DistrictFuelStation, {
  foreignKey: 'district_id',
  as: 'district_fuel_stations'
});
DistrictFuelStation.belongsTo(District, {
  foreignKey: 'district_id',
  as: 'district'
});

FuelStation.hasMany(DistrictFuelStation, {
  foreignKey: 'fuel_station_id',
  as: 'district_fuel_stations'
});
DistrictFuelStation.belongsTo(FuelStation, {
  foreignKey: 'fuel_station_id',
  as: 'fuel_station'
});

// WorkStatusReason bog'lanishlar
User.hasMany(WorkStatusReason, {
  foreignKey: 'created_by',
  as: 'created_work_reasons'
});
WorkStatusReason.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

// VehicleWorkStatus bog'lanishlar
Vehicle.hasMany(VehicleWorkStatus, {
  foreignKey: 'vehicle_id',
  as: 'work_status',
  onDelete: 'CASCADE'
});
VehicleWorkStatus.belongsTo(Vehicle, {
  foreignKey: 'vehicle_id',
  as: 'vehicle'
});

// WorkStatusReason → VehicleWorkStatus (One-to-Many)
WorkStatusReason.hasMany(VehicleWorkStatus, {
  foreignKey: 'reason_id',
  as: 'vehicle_statuses'
});
VehicleWorkStatus.belongsTo(WorkStatusReason, {
  foreignKey: 'reason_id',
  as: 'reason'
});

// User → VehicleWorkStatus (One-to-Many) - operator
User.hasMany(VehicleWorkStatus, {
  foreignKey: 'operator_id',
  as: 'operator_work_statuses'
});
VehicleWorkStatus.belongsTo(User, {
  foreignKey: 'operator_id',
  as: 'operator'
});

// User → VehicleWorkStatus (One-to-Many) - confirmed by
User.hasMany(VehicleWorkStatus, {
  foreignKey: 'confirmed_by',
  as: 'confirmed_work_statuses'
});
VehicleWorkStatus.belongsTo(User, {
  foreignKey: 'confirmed_by',
  as: 'confirmer'
});

// Ma'lumotlar bazasini sinxronlash funksiyasi
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log(force ? 
      '🔄 Ma\'lumotlar bazasi qayta yaratildi' : 
      '✅ Ma\'lumotlar bazasi sinxronlandi'
    );
  } catch (error) {
    console.error('❌ Ma\'lumotlar bazasini sinxronlashda xatolik:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  syncDatabase,
  
  // Modellar
  Company,
  District,
  Neighborhood,
  Role,
  User,
  LegalEntity,
  Contract,
  Vehicle,
  VehicleDailyData,
  VehicleFuelRecord,
  FuelStation,
  DistrictFuelStation,
  WorkStatusReason,
  VehicleWorkStatus
};
