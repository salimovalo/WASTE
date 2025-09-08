const { QueryInterface, DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    // Weather data jadvali
    await queryInterface.createTable('weather_data', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      district_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'districts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      temperature: {
        type: DataTypes.DECIMAL(4, 1),
        allowNull: true,
        comment: 'Harorat (Celsius)'
      },
      condition: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Ob-havo holati'
      },
      humidity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Namlik (%)'
      },
      wind_speed: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Shamol tezligi (m/s)'
      },
      pressure: {
        type: DataTypes.DECIMAL(7, 2),
        allowNull: true,
        comment: 'Atmosfera bosimi (hPa)'
      },
      api_response: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'API javob (JSON)'
      },
      source: {
        type: DataTypes.ENUM('manual', 'api', 'weatherapi', 'openweather', 'accuweather'),
        defaultValue: 'manual'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Weather config jadvali
    await queryInterface.createTable('weather_config', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      api_provider: {
        type: DataTypes.ENUM('weatherapi', 'openweather', 'accuweather', 'visualcrossing'),
        allowNull: false,
        defaultValue: 'weatherapi'
      },
      api_key: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      api_url: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      update_interval: {
        type: DataTypes.INTEGER,
        defaultValue: 3600
      },
      auto_update: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Weather locations jadvali
    await queryInterface.createTable('weather_locations', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      district_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'districts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      weather_city: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true
      },
      country_code: {
        type: DataTypes.STRING(2),
        allowNull: true,
        defaultValue: 'UZ'
      },
      timezone: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: 'Asia/Tashkent'
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Indekslar
    await queryInterface.addIndex('weather_data', ['district_id', 'date'], {
      unique: true,
      name: 'weather_data_district_date_unique'
    });
    
    await queryInterface.addIndex('weather_data', ['date'], {
      name: 'weather_data_date_index'
    });
    
    await queryInterface.addIndex('weather_locations', ['weather_city'], {
      name: 'weather_locations_city_index'
    });

    // Default konfiguratsiya
    await queryInterface.bulkInsert('weather_config', [{
      api_provider: 'weatherapi',
      api_key: '86d37b917bf0444798a90831253008',
      api_url: 'https://api.weatherapi.com/v1',
      update_interval: 3600,
      auto_update: true,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // O'zbekiston asosiy shaharlarini qo'shish
    await queryInterface.bulkInsert('weather_locations', [
      {
        district_id: 1, // Angren (agar mavjud bo'lsa)
        weather_city: 'Angren',
        latitude: 41.0186,
        longitude: 70.1437,
        country_code: 'UZ',
        timezone: 'Asia/Tashkent',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        district_id: 2, // Toshkent
        weather_city: 'Tashkent',
        latitude: 41.2995,
        longitude: 69.2401,
        country_code: 'UZ',
        timezone: 'Asia/Tashkent',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('weather_data');
    await queryInterface.dropTable('weather_locations');
    await queryInterface.dropTable('weather_config');
  }
};
