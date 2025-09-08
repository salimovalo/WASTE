const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('polygons', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      capacity_m3: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true
      },
      current_volume_m3: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
      },
      district_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'districts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      coordinates: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      contact_person: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      contact_phone: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      operating_hours: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      waste_types: {
        type: DataTypes.JSONB,
        defaultValue: []
      },
      price_per_m3: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      is_public: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Indexes qo'shish
    await queryInterface.addIndex('polygons', ['district_id']);
    await queryInterface.addIndex('polygons', ['company_id']);
    await queryInterface.addIndex('polygons', ['is_active']);
    
    // Sample data qo'shish
    await queryInterface.bulkInsert('polygons', [
      {
        name: 'Oxangar poligoni',
        code: 'OXNG-001',
        description: 'Toshkent shahrining asosiy chiqindi poligoni',
        address: 'Toshkent shahar, Oxangar tumani',
        capacity_m3: 1000000.00,
        current_volume_m3: 0.00,
        coordinates: JSON.stringify({ lat: 41.2995, lng: 69.2401 }),
        contact_person: 'Poligon boshlig\'i',
        contact_phone: '+998 71 123 45 67',
        operating_hours: '06:00-22:00',
        waste_types: JSON.stringify(['tbo', 'construction', 'organic']),
        price_per_m3: 15000.00,
        is_active: true,
        is_public: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Toshkent poligoni',
        code: 'TSH-001',
        description: 'Toshkent viloyati poligoni',
        address: 'Toshkent viloyat, Zangiota tumani',
        capacity_m3: 500000.00,
        current_volume_m3: 0.00,
        coordinates: JSON.stringify({ lat: 41.2044, lng: 69.1102 }),
        contact_person: 'Poligon mas\'uli',
        contact_phone: '+998 71 234 56 78',
        operating_hours: '08:00-18:00',
        waste_types: JSON.stringify(['tbo', 'organic']),
        price_per_m3: 12000.00,
        is_active: true,
        is_public: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Nukus poligoni',
        code: 'NKS-001',
        description: 'Nukus shahar poligoni',
        address: 'Nukus shahar, Nukus tumani',
        capacity_m3: 300000.00,
        current_volume_m3: 0.00,
        coordinates: JSON.stringify({ lat: 42.4731, lng: 59.6103 }),
        contact_person: 'Poligon mudiri',
        contact_phone: '+998 61 223 44 55',
        operating_hours: '07:00-19:00',
        waste_types: JSON.stringify(['tbo']),
        price_per_m3: 10000.00,
        is_active: true,
        is_public: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Samarqand poligoni',
        code: 'SMQ-001',
        description: 'Samarqand shahar poligoni',
        address: 'Samarqand shahar, Samarqand tumani',
        capacity_m3: 400000.00,
        current_volume_m3: 0.00,
        coordinates: JSON.stringify({ lat: 39.6270, lng: 66.9750 }),
        contact_person: 'Poligon boshlig\'i',
        contact_phone: '+998 66 233 44 55',
        operating_hours: '06:00-20:00',
        waste_types: JSON.stringify(['tbo', 'construction']),
        price_per_m3: 13000.00,
        is_active: true,
        is_public: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Buxoro poligoni',
        code: 'BXR-001',
        description: 'Buxoro shahar poligoni',
        address: 'Buxoro shahar, Buxoro tumani',
        capacity_m3: 350000.00,
        current_volume_m3: 0.00,
        coordinates: JSON.stringify({ lat: 39.7747, lng: 64.4286 }),
        contact_person: 'Poligon mudiri',
        contact_phone: '+998 65 223 44 55',
        operating_hours: '07:00-19:00',
        waste_types: JSON.stringify(['tbo', 'organic']),
        price_per_m3: 11000.00,
        is_active: true,
        is_public: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('polygons');
  }
};
