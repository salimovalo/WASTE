'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Yo'l varaqalari (Trip sheets) jadvali
    await queryInterface.createTable('trip_sheets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      trip_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Yo\'l varaqasi raqami'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Ish sanasi'
      },
      vehicle_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'vehicles',
          key: 'id'
        },
        comment: 'Texnika ID'
      },
      driver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'Haydovchi ID'
      },
      loader1_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'Birinchi yuk ortuvchi ID'
      },
      loader2_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'Ikkinchi yuk ortuvchi ID'
      },
      
      // Spidometr ko'rsatkichlari
      odometer_start: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Spidometr kun boshida'
      },
      odometer_end: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Spidometr kun oxirida'
      },
      
      // Ish vaqti
      work_hours_volume: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
        comment: 'Ish soatlari (hajm)'
      },
      work_hours_other: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
        comment: 'Ish soatlari (boshqa)'
      },
      machine_hours: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
        comment: 'Mashina soatlari'
      },
      
      // Jo'nalishlar
      total_trips: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Jami jo\'nalishlar soni'
      },
      
      // Masofalar
      total_distance: {
        type: Sequelize.DECIMAL(8, 2),
        defaultValue: 0,
        comment: 'Jami yurgan masofa (km)'
      },
      other_distance: {
        type: Sequelize.DECIMAL(8, 2),
        defaultValue: 0,
        comment: 'Boshqa masofalar (km)'
      },
      loaded_distance: {
        type: Sequelize.DECIMAL(8, 2),
        defaultValue: 0,
        comment: 'Yuk bilan yurgan masofa (km)'
      },
      
      // Yoqilg'i hisobi
      fuel_start: {
        type: Sequelize.DECIMAL(8, 2),
        defaultValue: 0,
        comment: 'Kun boshida yoqilg\'i qoldig\'i (litr)'
      },
      fuel_refilled: {
        type: Sequelize.DECIMAL(8, 2),
        defaultValue: 0,
        comment: 'Olingan yoqilg\'i (litr)'
      },
      fuel_station_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'fuel_stations',
          key: 'id'
        },
        comment: 'Zapravka ID'
      },
      fuel_consumption_actual: {
        type: Sequelize.DECIMAL(8, 2),
        defaultValue: 0,
        comment: 'Haqiqiy yoqilg\'i sarfiyoti (litr)'
      },
      fuel_consumption_norm: {
        type: Sequelize.DECIMAL(8, 2),
        defaultValue: 0,
        comment: 'Normativ yoqilg\'i sarfiyoti (litr)'
      },
      fuel_end: {
        type: Sequelize.DECIMAL(8, 2),
        defaultValue: 0,
        comment: 'Kun oxirida yoqilg\'i qoldig\'i (litr)'
      },
      
      // Status va tasdiqlash
      status: {
        type: Sequelize.ENUM('draft', 'submitted', 'approved', 'rejected'),
        defaultValue: 'draft',
        comment: 'Holat'
      },
      submitted_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'Yuborgan operator'
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Yuborilgan vaqt'
      },
      approved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'Tasdiqlagan admin'
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Tasdiqlangan vaqt'
      },
      
      // Qo'shimcha ma'lumotlar
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Izohlar'
      },
      photo_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Kunlik rasim URL'
      },
      
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    
    // 2. Chiqindixonalar (Disposal sites) jadvali
    await queryInterface.createTable('disposal_sites', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'Chiqindixona nomi'
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Kod'
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Manzil'
      },
      type: {
        type: Sequelize.ENUM('tbo', 'smet', 'other'),
        defaultValue: 'tbo',
        comment: 'Chiqindixona turi'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Faol holat'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    
    // 3. Yo'l varaqasi yuklar (Trip loads) jadvali
    await queryInterface.createTable('trip_loads', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      trip_sheet_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'trip_sheets',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'Yo\'l varaqasi ID'
      },
      disposal_site_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'disposal_sites',
          key: 'id'
        },
        comment: 'Chiqindixona ID'
      },
      
      // Yuk ma'lumotlari
      trips_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Jo\'nalishlar soni'
      },
      distance_with_load: {
        type: Sequelize.DECIMAL(8, 2),
        defaultValue: 0,
        comment: 'Yuk bilan masofa (km)'
      },
      
      // TBO (Qattiq maishiy chiqindilar)
      tbo_volume_m3: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'TBO hajmi (m3)'
      },
      tbo_weight_tn: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'TBO og\'irligi (tonna)'
      },
      
      // Smet (Yo'l axlati)
      smet_volume_m3: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Smet hajmi (m3)'
      },
      smet_weight_tn: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Smet og\'irligi (tonna)'
      },
      
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    
    // Indekslar qo'shish
    await queryInterface.addIndex('trip_sheets', ['date', 'vehicle_id'], {
      unique: true,
      name: 'unique_vehicle_date_trip'
    });
    
    await queryInterface.addIndex('trip_sheets', ['trip_number']);
    await queryInterface.addIndex('trip_sheets', ['driver_id']);
    await queryInterface.addIndex('trip_sheets', ['status']);
    await queryInterface.addIndex('trip_loads', ['trip_sheet_id']);
    await queryInterface.addIndex('trip_loads', ['disposal_site_id']);
    
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('trip_loads');
    await queryInterface.dropTable('disposal_sites');
    await queryInterface.dropTable('trip_sheets');
  }
};
