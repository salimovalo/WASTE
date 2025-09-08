const express = require('express');
const router = express.Router();
const { Weather, WeatherConfig, WeatherLocation, District } = require('../models');
const { authenticate } = require('../middleware/auth');
const axios = require('axios');

// Get weather config
router.get('/config', async (req, res) => {
  try {
    const config = await WeatherConfig.findOne({
      where: { is_active: true }
    });
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Ob-havo konfiguratsiyasi topilmadi'
      });
    }

    // API key ni xavfsizlik uchun yashirish
    const safeConfig = {
      ...config.toJSON(),
      api_key: config.api_key ? '***' + config.api_key.slice(-4) : null
    };

    res.json({
      success: true,
      data: safeConfig
    });
  } catch (error) {
    console.error('Weather config yuklash xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Ob-havo konfiguratsiyasini yuklashda xatolik'
    });
  }
});

// Update weather config
router.put('/config', async (req, res) => {
  try {
    const { api_provider, api_key, api_url, update_interval, auto_update } = req.body;

    // Validate API key by testing
    if (api_key && api_key !== '***') {
      try {
        let testUrl;
        switch (api_provider) {
          case 'weatherapi':
            testUrl = `https://api.weatherapi.com/v1/current.json?key=${api_key}&q=Tashkent&aqi=no`;
            break;
          case 'openweather':
            testUrl = `https://api.openweathermap.org/data/2.5/weather?q=Tashkent&appid=${api_key}`;
            break;
          default:
            throw new Error('Noma\'lum API provider');
        }

        const testResponse = await axios.get(testUrl, { timeout: 10000 });
        if (!testResponse.data) {
          throw new Error('API javob bo\'sh');
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'API key noto\'g\'ri yoki ishlamayapti: ' + error.message
        });
      }
    }

    let config = await WeatherConfig.findOne({ where: { is_active: true } });
    
    if (config) {
      await config.update({
        api_provider,
        api_key: api_key === '***' ? config.api_key : api_key,
        api_url,
        update_interval,
        auto_update
      });
    } else {
      config = await WeatherConfig.create({
        api_provider,
        api_key,
        api_url,
        update_interval,
        auto_update,
        is_active: true
      });
    }

    res.json({
      success: true,
      message: 'Ob-havo konfiguratsiyasi saqlandi',
      data: {
        ...config.toJSON(),
        api_key: config.api_key ? '***' + config.api_key.slice(-4) : null
      }
    });
  } catch (error) {
    console.error('Weather config saqlash xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Konfiguratsiyani saqlashda xatolik'
    });
  }
});

// Get weather locations (district mappings)
router.get('/locations', async (req, res) => {
  try {
    const locations = await WeatherLocation.findAll({
      include: [{
        model: District,
        as: 'district',
        attributes: ['id', 'name', 'code', 'region']
      }],
      order: [['district', 'name', 'ASC']]
    });

    // Get all districts without weather locations
    const allDistricts = await District.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'code', 'region'],
      order: [['name', 'ASC']]
    });

    const mappedDistrictIds = locations.map(loc => loc.district_id);
    const unmappedDistricts = allDistricts.filter(d => !mappedDistrictIds.includes(d.id));

    res.json({
      success: true,
      data: {
        mapped: locations,
        unmapped: unmappedDistricts
      }
    });
  } catch (error) {
    console.error('Weather locations yuklash xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Ob-havo joylashuvlarini yuklashda xatolik'
    });
  }
});

// Create or update weather location
router.post('/locations', async (req, res) => {
  try {
    const { district_id, weather_city, latitude, longitude } = req.body;

    // Check if district exists
    const district = await District.findByPk(district_id);
    if (!district) {
      return res.status(404).json({
        success: false,
        message: 'Tuman topilmadi'
      });
    }

    // Validate coordinates with weather API
    const config = await WeatherConfig.findOne({ where: { is_active: true } });
    if (config && config.api_key) {
      try {
        let testUrl;
        const location = latitude && longitude ? `${latitude},${longitude}` : weather_city;
        
        switch (config.api_provider) {
          case 'weatherapi':
            testUrl = `https://api.weatherapi.com/v1/current.json?key=${config.api_key}&q=${location}&aqi=no`;
            break;
          case 'openweather':
            testUrl = `https://api.openweathermap.org/data/2.5/weather?q=${weather_city}&appid=${config.api_key}`;
            break;
        }

        if (testUrl) {
          const testResponse = await axios.get(testUrl, { timeout: 10000 });
          if (!testResponse.data) {
            throw new Error('Joylashuv topilmadi');
          }
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Joylashuv noto\'g\'ri yoki topilmadi: ' + error.message
        });
      }
    }

    const [location, created] = await WeatherLocation.upsert({
      district_id,
      weather_city,
      latitude,
      longitude,
      is_active: true
    });

    res.json({
      success: true,
      message: created ? 'Joylashuv qo\'shildi' : 'Joylashuv yangilandi',
      data: location
    });
  } catch (error) {
    console.error('Weather location saqlash xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Joylashuvni saqlashda xatolik'
    });
  }
});

// Delete weather location
router.delete('/locations/:id', async (req, res) => {
  try {
    const location = await WeatherLocation.findByPk(req.params.id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Joylashuv topilmadi'
      });
    }

    await location.destroy();

    res.json({
      success: true,
      message: 'Joylashuv o\'chirildi'
    });
  } catch (error) {
    console.error('Weather location o\'chirish xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Joylashuvni o\'chirishda xatolik'
    });
  }
});

// Fetch weather data from API
router.post('/fetch', async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.body;

    const config = await WeatherConfig.findOne({ where: { is_active: true } });
    if (!config || !config.api_key) {
      return res.status(400).json({
        success: false,
        message: 'Ob-havo API konfiguratsiyasi topilmadi'
      });
    }

    const locations = await WeatherLocation.findAll({
      where: { is_active: true },
      include: [{
        model: District,
        as: 'district',
        attributes: ['id', 'name']
      }]
    });

    const results = [];
    const errors = [];

    for (const location of locations) {
      try {
        let apiUrl;
        const coordinates = location.latitude && location.longitude 
          ? `${location.latitude},${location.longitude}` 
          : location.weather_city;

        switch (config.api_provider) {
          case 'weatherapi':
            apiUrl = `${config.api_url || 'https://api.weatherapi.com/v1'}/history.json?key=${config.api_key}&q=${coordinates}&dt=${date}`;
            break;
          case 'openweather':
            // Historical data requires paid plan, use current data
            apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location.weather_city}&appid=${config.api_key}&units=metric`;
            break;
          default:
            throw new Error('Noma\'lum API provider');
        }

        const response = await axios.get(apiUrl, { timeout: 15000 });
        let weatherData;

        switch (config.api_provider) {
          case 'weatherapi':
            const dayData = response.data.forecast?.forecastday?.[0]?.day || response.data.current;
            weatherData = {
              temperature: dayData.avgtemp_c || dayData.temp_c,
              condition: dayData.condition?.text || 'Unknown',
              humidity: dayData.avghumidity || dayData.humidity,
              wind_speed: dayData.maxwind_kph ? dayData.maxwind_kph * 0.277778 : null, // kph to m/s
              pressure: dayData.condition?.pressure || null
            };
            break;
          case 'openweather':
            weatherData = {
              temperature: response.data.main.temp,
              condition: response.data.weather[0].description,
              humidity: response.data.main.humidity,
              wind_speed: response.data.wind.speed,
              pressure: response.data.main.pressure
            };
            break;
        }

        // Save to database
        const [weather, created] = await Weather.upsert({
          district_id: location.district_id,
          date: date,
          temperature: weatherData.temperature,
          condition: weatherData.condition,
          humidity: weatherData.humidity,
          wind_speed: weatherData.wind_speed,
          pressure: weatherData.pressure,
          api_response: JSON.stringify(response.data),
          source: config.api_provider
        });

        results.push({
          district: location.district.name,
          weather: weatherData,
          created: created
        });

      } catch (error) {
        errors.push({
          district: location.district.name,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `${results.length} ta tuman uchun ob-havo ma'lumotlari yangilandi`,
      data: { results, errors }
    });

  } catch (error) {
    console.error('Weather data yuklash xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Ob-havo ma\'lumotlarini yuklashda xatolik'
    });
  }
});

module.exports = router;
