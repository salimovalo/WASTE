import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Typography, 
  Button, 
  Space,
  DatePicker,
  InputNumber,
  Input,
  Select,
  Upload,
  Image,
  Divider,
  Statistic,
  Row,
  Col,
  Tag,
  message,
  Spin,
  Modal,
  Tooltip,
  Progress,
  Alert,
  Popconfirm,
  Switch,
  Badge
} from 'antd';
import { 
  ArrowLeftOutlined,
  PrinterOutlined,
  DownloadOutlined,
  EditOutlined,
  SaveOutlined,
  CarOutlined,
  CalendarOutlined,
  UserOutlined,
  PictureOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  CloudUploadOutlined,
  CopyOutlined,
  CheckOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import moment from 'moment';
import api from '../../services/api';
import useDateStore from '../../stores/dateStore';
import { useAuthStore } from '../../stores/authStore';
import './VehicleMonthlyCard.css';
import './VehicleMonthlyCard-enhanced.css';

const { Title, Text } = Typography;
const { Option } = Select;

const VehicleMonthlyCard = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [vehicle, setVehicle] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(moment());
  const [editingCell, setEditingCell] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [loaders, setLoaders] = useState([]);
  const [fuelStations, setFuelStations] = useState([]);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
  const [selectedCells, setSelectedCells] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [batchOperations, setBatchOperations] = useState(false);
  const [monthStartOdometer, setMonthStartOdometer] = useState(10000);
  const [monthStartSpeedometer, setMonthStartSpeedometer] = useState(10000);
  const [monthStartFuel, setMonthStartFuel] = useState(50);
  const [polygonList, setPolygonList] = useState([]);
  const [columnWidths, setColumnWidths] = useState({});
  const [resizingColumn, setResizingColumn] = useState(null);
  const [defaultDriver, setDefaultDriver] = useState(null);
  const [defaultLoader1, setDefaultLoader1] = useState(null);
  const [defaultLoader2, setDefaultLoader2] = useState(null);
  const [nightShifts, setNightShifts] = useState([]); // Array of night shifts: [{afterDay: 5, data: {}}]
  const [volumeModalVisible, setVolumeModalVisible] = useState(false);
  const [selectedVolumeRecord, setSelectedVolumeRecord] = useState(null);
  const [fuelModalVisible, setFuelModalVisible] = useState(false);
  const [selectedFuelRecord, setSelectedFuelRecord] = useState(null);
  
  const { user } = useAuthStore();
  const { selectedDate } = useDateStore();

  useEffect(() => {
    if (vehicleId) {
      loadVehicleData();
      loadMonthlyData();
      loadMasterData();
    }
  }, [vehicleId, selectedMonth]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveEnabled && hasUnsavedChanges) {
      const timer = setTimeout(() => {
        handleSave(true); // silent save
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [hasUnsavedChanges, autoSaveEnabled]);

  // Update first day odometer when month start odometer changes
  useEffect(() => {
    if (monthlyData.length > 0 && monthStartOdometer !== null && monthStartOdometer !== undefined) {
      const firstDay = monthlyData.find(item => item.key === 1);
      if (firstDay && firstDay.odometer_start !== monthStartOdometer) {
        const newData = monthlyData.map(item => 
          item.key === 1 
            ? { ...item, odometer_start: monthStartOdometer, calculated_start: monthStartOdometer }
            : item
        );
        setMonthlyData(newData);
        setHasUnsavedChanges(true);
      }
    }
  }, [monthStartOdometer, monthlyData.length]);

  // Update first day speedometer when month start speedometer changes
  useEffect(() => {
    if (monthlyData.length > 0 && monthStartSpeedometer !== null && monthStartSpeedometer !== undefined) {
      const firstDay = monthlyData.find(item => item.key === 1);
      if (firstDay && firstDay.speedometer_start !== monthStartSpeedometer) {
        const newData = monthlyData.map(item => 
          item.key === 1 
            ? { ...item, speedometer_start: monthStartSpeedometer, calculated_speedometer_start: monthStartSpeedometer }
            : item
        );
        setMonthlyData(newData);
        setHasUnsavedChanges(true);
      }
    }
  }, [monthStartSpeedometer, monthlyData.length]);

  // Update first day fuel when month start fuel changes
  useEffect(() => {
    if (monthlyData.length > 0 && monthStartFuel !== null && monthStartFuel !== undefined) {
      const firstDay = monthlyData.find(item => item.key === 1);
      if (firstDay && firstDay.fuel_start !== monthStartFuel) {
        const newData = monthlyData.map(item => 
          item.key === 1 
            ? { ...item, fuel_start: monthStartFuel, calculated_fuel_start: monthStartFuel }
            : item
        );
        setMonthlyData(newData);
        setHasUnsavedChanges(true);
      }
    }
  }, [monthStartFuel, monthlyData.length]);

  const loadVehicleData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/technics/${vehicleId}`);
      setVehicle(response.data.data || response.data);
    } catch (error) {
      console.error('Avtomobil ma\'lumotlarini yuklashda xatolik:', error);
      message.error('Avtomobil ma\'lumotlarini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const loadWeatherData = async (monthlyEntries) => {
    try {
      // Fake weather data for demo - replace with real API
      const weatherPromises = monthlyEntries.map(async (entry, index) => {
        // Simulate random temperature between -10 and +30
        const temp = Math.random() * 40 - 10;
        
        // For demo: make some days cold (below 0) to test fuel norm increase
        const isWinter = selectedMonth.month() >= 10 || selectedMonth.month() <= 2;
        const finalTemp = isWinter ? Math.random() * 20 - 15 : Math.random() * 35 + 5;
        
        return {
          ...entry,
          weather_temp: Math.round(finalTemp),
          weather_condition: finalTemp < 0 ? 'cold' : (finalTemp > 25 ? 'hot' : 'normal')
        };
      });
      
      return await Promise.all(weatherPromises);
    } catch (error) {
      console.error('Weather data loading error:', error);
      return monthlyEntries; // Return original data if weather fails
    }
  };

  const loadMasterData = async () => {
    try {
      // Load drivers from Employee model
      const driversRes = await api.get('/trip-sheets/employees/drivers', {
        params: { 
          company_id: vehicle?.company_id,
          district_id: vehicle?.district_id,
          limit: 100 
        }
      });
      setDrivers(driversRes.data.data || []);

      // Load loaders from Employee model
      const loadersRes = await api.get('/trip-sheets/employees/loaders', {
        params: { 
          company_id: vehicle?.company_id,
          district_id: vehicle?.district_id,
          limit: 100 
        }
      });
      setLoaders(loadersRes.data.data || []);

      // Load fuel stations
      const fuelRes = await api.get('/fuel-stations', {
        params: { limit: 100, is_active: true }
      });
      setFuelStations(fuelRes.data.fuel_stations || fuelRes.data || []);

      // Load polygon list
      try {
        const polygonRes = await api.get('/polygons', {
          params: { limit: 50, is_active: true }
        });
        setPolygonList(polygonRes.data.polygons || polygonRes.data || [
          { id: 'oxangar', name: 'Oxangar poligoni' },
          { id: 'tashkent_poligon', name: 'Toshkent poligoni' },
          { id: 'nukus_poligon', name: 'Nukus poligoni' },
          { id: 'samarkand_poligon', name: 'Samarqand poligoni' },
          { id: 'bukhara_poligon', name: 'Buxoro poligoni' }
        ]);
      } catch (polygonError) {
        // Default polygons if API fails
        setPolygonList([
          { id: 'oxangar', name: 'Oxangar poligoni' },
          { id: 'tashkent_poligon', name: 'Toshkent poligoni' },
          { id: 'nukus_poligon', name: 'Nukus poligoni' },
          { id: 'samarkand_poligon', name: 'Samarqand poligoni' },
          { id: 'bukhara_poligon', name: 'Buxoro poligoni' }
        ]);
      }
    } catch (error) {
      console.error('Error loading master data:', error);
      // Don't show error - not critical
    }
  };

  const loadMonthlyData = async () => {
    try {
      setLoading(true);
      
      // Generate days for selected month
      const monthStart = selectedMonth.clone().startOf('month');
      const monthEnd = selectedMonth.clone().endOf('month');
      const daysInMonth = monthEnd.date();
      
      const monthlyEntries = [];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = monthStart.clone().date(day);
        
        // Default empty entry for each day
        const dayEntry = {
          key: day,
          date: currentDate.format('DD'),
          day_name: currentDate.format('dd'),
          trip_number: '',
          driver_name: 'Normatov X', // Default driver in Uzbek
          driver_id: null,
          
          // Yuk ortuvchilar
          loader1_id: null,
          loader1_name: '',
          loader2_id: null,
          loader2_name: '',
          
          // Spidometr va KM
          odometer_start: day === 1 ? 10000 : 0,
          odometer_end: 0,
          daily_km: 0,
          calculated_start: day === 1 ? 10000 : 0,
          
          // Oy boshi spidometr va yoqilg'i
          speedometer_start: day === 1 ? monthStartSpeedometer : 0,
          speedometer_end: 0,
          calculated_speedometer_start: day === 1 ? monthStartSpeedometer : 0,
          fuel_start: day === 1 ? monthStartFuel : 0,
          fuel_end: 0,
          calculated_fuel_start: day === 1 ? monthStartFuel : 0,
          
          // Machine hours
          machine_hours: 0,
          
          // Poligon safarlari va destinatsiyalar
          waste_tbo_trips: 0,
          polygon_1: '',
          polygon_2: '',
          polygon_3: '',
          polygon_4: '',
          polygon_5: '',
          
          // Waste volumes with hybrid calculation and breakdown
          waste_volume_m3: 21,
          waste_volume_calculated: 0, // Automatic calculation based on trips
          waste_volume_manual: 0, // Manual override
          daily_km_manual: 0, // Manual KM override
          
          // Volume breakdown by source
          volume_breakdown: {
            mahalla: 0,
            tashkilot: 0,
            msp: 0,
            boshqa: 0
          },
          
          // Fuel - multiple sources support
          fuel_remaining_start: day === 1 ? monthStartFuel : 0, // 1-sanada oy boshi yoqilg'isidan
          fuel_station: '',
          fuel_station_id: null,
          fuel_taken: 0,
          fuel_remaining_end: 0,
          fuel_sources: [], // Array of {station_id, station_name, amount}
          
          // Weather data
          weather_temp: null, // Will be loaded from API
          weather_condition: null,
          
          // Status and metadata
          is_weekend: currentDate.day() === 0 || currentDate.day() === 6,
          is_today: currentDate.format('YYYY-MM-DD') === moment().format('YYYY-MM-DD'),
          status: day <= moment().date() && selectedMonth.month() === moment().month() ? 'completed' : 'pending'
        };
        
        monthlyEntries.push(dayEntry);
      }
      
      // Try to load actual data from API
      try {
        const response = await api.get(`/trip-sheets/monthly/${vehicleId}`, {
          params: {
            month: selectedMonth.format('YYYY-MM')
          }
        });
        
        // Merge with actual data if available
        const actualData = response.data || [];
        actualData.forEach(actual => {
          const day = moment(actual.date).date();
          const entry = monthlyEntries.find(e => e.key === day);
          if (entry) {
            Object.assign(entry, {
              trip_number: actual.trip_number || '',
              driver_id: actual.driver_id || null,
              driver_name: actual.driver_name || entry.driver_name,
              loader1_id: actual.loader1_id || null,
              loader1_name: actual.loader1_name || '',
              loader2_id: actual.loader2_id || null,
              loader2_name: actual.loader2_name || '',
              odometer_start: actual.odometer_start || entry.odometer_start,
              odometer_end: actual.odometer_end || 0,
              calculated_start: actual.odometer_start || entry.calculated_start,
              machine_hours: actual.machine_hours || 0,
              waste_tbo_trips: actual.total_trips || 0,
              polygon_1: actual.polygon_1 || '',
              polygon_2: actual.polygon_2 || '',
              polygon_3: actual.polygon_3 || '',
              polygon_4: actual.polygon_4 || '',
              polygon_5: actual.polygon_5 || '',
              waste_volume_m3: actual.waste_volume_m3 || 21,
              waste_source_type: actual.waste_source_type || 'mahalla',
              fuel_remaining_start: actual.fuel_remaining_start || 0,
              fuel_station_id: actual.fuel_station_id || null,
              fuel_station: actual.fuel_station || '',
              fuel_taken: actual.fuel_taken || 0,
              fuel_remaining_end: actual.fuel_remaining_end || 0
            });
          }
        });
      } catch (apiError) {
        console.log('No monthly data found, using defaults');
      }
      
      // Load weather data for all entries
      const entriesWithWeather = await loadWeatherData(monthlyEntries);
      
      // Spidometr logic: faqat birinchi kunning chiqishi to'ldiriladi, qolganlari bo'sh
      const entriesWithSpeedometer = entriesWithWeather.map((entry, index) => {
        if (index === 0) {
          // Birinchi kun - oy boshi spidometridan
          return {
            ...entry,
            odometer_start: monthStartOdometer || 10000,
            calculated_start: monthStartOdometer || 10000
          };
        } else {
          // Qolgan kunlar - chiqish bo'sh, KM kiritilganda qaytish avtomatik hisoblanadi
          return {
            ...entry,
            odometer_start: 0, // Keyinroq avtomatik to'ldiriladi
            odometer_end: 0,   // KM kiritilganda hisoblanadi
            daily_km_manual: 0
          };
        }
      });
      
      setMonthlyData(entriesWithSpeedometer);
      
    } catch (error) {
      console.error('Oylik ma\'lumotlarni yuklashda xatolik:', error);
      message.error('Oylik ma\'lumotlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleNightShiftEdit = (record, field, value) => {
    // Tungi smena ma'lumotlarini yangilash
    const updatedNightShifts = nightShifts.map(shift => {
      if (shift.data.key === record.key) {
        const updatedShiftData = { ...shift.data, [field]: value };
        
        // Agar tungi smena spidometri yangilansa
        if (field === 'odometer_end') {
          // Keyingi kunga ta'sir qilish
          const afterDay = shift.afterDay;
          const nextDayRecord = monthlyData.find(item => item.key === afterDay + 1);
          if (nextDayRecord) {
            const newMonthlyData = monthlyData.map(item => 
              item.key === afterDay + 1 
                ? { 
                    ...item, 
                    odometer_start: value, 
                    calculated_start: value,
                    speedometer_start: value, 
                    calculated_speedometer_start: value 
                  }
                : item
            );
            setMonthlyData(newMonthlyData);
          }
        }
        
        // KM o'zgarsa spidometr oxirini hisoblash
        if (field === 'daily_km_manual') {
          const chiqish = updatedShiftData.odometer_start || 0;
          const km = value || 0;
          updatedShiftData.odometer_end = chiqish + km;
          updatedShiftData.speedometer_end = chiqish + km;
          
          // Keyingi kun spidometr boshlanishini yangilash
          const afterDay = shift.afterDay;
          const nextDayRecord = monthlyData.find(item => item.key === afterDay + 1);
          if (nextDayRecord) {
            const newMonthlyData = monthlyData.map(item => 
              item.key === afterDay + 1 
                ? { 
                    ...item, 
                    odometer_start: chiqish + km, 
                    calculated_start: chiqish + km,
                    speedometer_start: chiqish + km, 
                    calculated_speedometer_start: chiqish + km 
                  }
                : item
            );
            setMonthlyData(newMonthlyData);
          }
        }
        
        return { ...shift, data: updatedShiftData };
      }
      return shift;
    });
    
    setNightShifts(updatedNightShifts);
    setHasUnsavedChanges(true);
  };

  const handleCellEdit = (record, field, value) => {
    // Tungi smena ekanligini tekshirish
    if (record.is_night_shift) {
      handleNightShiftEdit(record, field, value);
      return;
    }
    
    let newData = monthlyData.map(item => 
      item.key === record.key 
        ? { ...item, [field]: value }
        : item
    );
    
    // KM o'zgartirilganda qaytishni va keyingi kun chiqishini yangilash
    if (field === 'daily_km_manual') {
      const currentRecord = newData.find(item => item.key === record.key);
      if (currentRecord) {
        const chiqish = currentRecord.odometer_start || 0;
        const km = value || 0;
        const qaytish = chiqish + km;
        
        // Qaytishni yangilash
        newData = newData.map(item => 
          item.key === record.key 
            ? { ...item, odometer_end: qaytish }
            : item
        );
        
        // Keyingi kun chiqishini yangilash va zanjir effekti
        let currentQaytish = qaytish;
        for (let nextDay = record.key + 1; nextDay <= 31; nextDay++) {
          const nextRecord = newData.find(item => item.key === nextDay);
          if (nextRecord) {
            const nextKm = nextRecord.daily_km_manual || 0;
            const nextQaytish = currentQaytish + nextKm;
            
            newData = newData.map(item => 
              item.key === nextDay 
                ? { 
                    ...item, 
                    odometer_start: currentQaytish,
                    calculated_start: currentQaytish,
                    odometer_end: nextQaytish
                  }
                : item
            );
            
            currentQaytish = nextQaytish;
          } else {
            break;
          }
        }
      }
    }

    // Oy boshi spidometr mantiqini hisoblash
    if (field === 'speedometer_end') {
      const currentDayIndex = record.key;
      
      // Tungi smena bormi tekshirish
      const nightShiftForCurrentDay = nightShifts.find(shift => shift.afterDay === currentDayIndex);
      
      if (nightShiftForCurrentDay) {
        // Agar tungi smena bo'lsa, avval tungi smenaning boshlanishini yangilash
        const updatedNightShifts = nightShifts.map(shift => 
          shift.afterDay === currentDayIndex
            ? { 
                ...shift, 
                data: { 
                  ...shift.data, 
                  speedometer_start: value, 
                  calculated_speedometer_start: value 
                }
              }
            : shift
        );
        setNightShifts(updatedNightShifts);
        
        // Tungi smena oxirini ham yangilash (agar kiritilgan bo'lsa)
        if (nightShiftForCurrentDay.data.speedometer_end) {
          // Keyingi kun uchun tungi smena oxiridan boshlash
          const nextDayRecord = newData.find(item => item.key === currentDayIndex + 1);
          if (nextDayRecord) {
            newData = newData.map(item => 
              item.key === currentDayIndex + 1 
                ? { 
                    ...item, 
                    speedometer_start: nightShiftForCurrentDay.data.speedometer_end, 
                    calculated_speedometer_start: nightShiftForCurrentDay.data.speedometer_end 
                  }
                : item
            );
          }
        }
      } else {
        // Oddiy holat: keyingi kun boshlanishini yangilash
      const nextDayRecord = newData.find(item => item.key === currentDayIndex + 1);
      if (nextDayRecord) {
        newData = newData.map(item => 
          item.key === currentDayIndex + 1 
            ? { ...item, speedometer_start: value, calculated_speedometer_start: value }
            : item
        );
        }
      }
    }

    // Oy boshi yoqilg'i mantiqini hisoblash  
    if (field === 'fuel_end') {
      const currentDayIndex = record.key;
      const nextDayRecord = newData.find(item => item.key === currentDayIndex + 1);
      if (nextDayRecord) {
        newData = newData.map(item => 
          item.key === currentDayIndex + 1 
            ? { ...item, fuel_start: value, calculated_fuel_start: value }
            : item
        );
      }
    }
    
    setMonthlyData(newData);
    setHasUnsavedChanges(true);
    
    // Auto-calculate derived values
    const updatedRecord = newData.find(item => item.key === record.key);
    if (updatedRecord) {
      calculateDerivedValues(updatedRecord, field);
      validateRecord(updatedRecord);
    }
  };

  const calculateDerivedValues = (record, changedField) => {
    // KM o'zgartirilganda qaytishni hisoblash va keyingi kun chiqishini yangilash
    if (changedField === 'daily_km_manual') {
      const chiqish = record.odometer_start || 0;
      const km = record.daily_km_manual || 0;
      record.odometer_end = chiqish + km;
      

    }
    
    // Chiqish o'zgartirilganda faqat qaytishni qayta hisoblash
    if (changedField === 'odometer_start') {
      const chiqish = record.odometer_start || 0;
      const km = record.daily_km_manual || 0;
      record.odometer_end = chiqish + km;
    }
    
    // KM o'zgartirilganda qaytishni qayta hisoblash
    if (changedField === 'daily_km_manual') {
      const chiqish = record.odometer_start || 0;
      const km = record.daily_km_manual || 0;
      record.odometer_end = chiqish + km;
    }
    
    // Hybrid volume calculation - avtomatik + manual
    if (changedField === 'waste_tbo_trips' || changedField === 'waste_volume_manual') {
      const trips = record.waste_tbo_trips || 0;
      const vehicleCapacity = vehicle?.capacity || 7; // Default capacity
      const calculatedVolume = trips * vehicleCapacity;
      const manualVolume = record.waste_volume_manual || 0;
      
      record.waste_volume_calculated = calculatedVolume;
      // Use manual volume if specified, otherwise use calculated
      record.waste_volume_m3 = manualVolume > 0 ? manualVolume : calculatedVolume;
    }
    
    // Calculate total fuel
    if (changedField === 'fuel_volume_plan' || changedField === 'fuel_volume_other') {
      record.fuel_volume_total = (record.fuel_volume_plan || 0) + (record.fuel_volume_other || 0);
    }
    
    // Calculate total waste
    if (changedField === 'waste_tbo_volume' || changedField === 'waste_smet_volume') {
      record.waste_total_volume = (record.waste_tbo_volume || 0) + (record.waste_smet_volume || 0);
    }
    
    // Calculate fuel efficiency
    if (changedField === 'fuel_consumed_actual' || changedField === 'fuel_consumed_norm') {
      if (record.fuel_consumed_norm > 0) {
        record.fuel_efficiency_percent = ((record.fuel_consumed_actual / record.fuel_consumed_norm) * 100).toFixed(1);
      }
    }

  };

  const handleSave = async (silent = false) => {
    try {
      setLoading(true);
      
      // Validate all records before saving
      const validRecords = monthlyData.filter(record => {
        if (record.trip_number || record.odometer_start > 0) {
          return validateRecord(record);
        }
        return true;
      });
      
      if (validRecords.length !== monthlyData.filter(r => r.trip_number || r.odometer_start > 0).length) {
        if (!silent) {
          message.warning('Ba\'zi yozuvlarda xatoliklar mavjud. Iltimos tekshirib ko\'ring.');
        }
        return;
      }
      
      // Save monthly data
      await api.post(`/trip-sheets/monthly/${vehicleId}`, {
        month: selectedMonth.format('YYYY-MM'),
        data: monthlyData
      });
      
      setHasUnsavedChanges(false);
      
      if (!silent) {
        message.success('Ma\'lumotlar muvaffaqiyatli saqlandi!');
      }
    } catch (error) {
      console.error('Save error:', error);
      if (!silent) {
        message.error('Saqlashda xatolik: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const validateRecord = (record) => {
    const errors = [];
    
    // Spidometrni tekshirish
    if (record.odometer_end > 0 && record.odometer_start > 0) {
      if (record.odometer_end < record.odometer_start) {
        errors.push('Spidometr oxiri ko\'rsatkichi boshlanishidan kichik bo\'lolmaydi');
      } else {
        record.distance = record.odometer_end - record.odometer_start;
      }
    }
    
    // Yoqilg'ini tekshirish
    if (record.fuel_consumed_actual > (record.fuel_remaining_start + record.fuel_taken)) {
      errors.push('Sarflangan yoqilg\'i miqdori mavjud yoqilg\'idan ko\'proq bo\'lolmaydi');
    }
    
    // Safar sonini tekshirish
    if (record.waste_tbo_trips > 10) {
      errors.push('Safar soni haddan ko\'p (10 dan ortiq)');
    }
    
    record.validation_errors = errors;
    return errors.length === 0;
  };

  const handlePhotoUpload = async (file, record) => {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('vehicle_id', vehicleId);
      formData.append('date', record.full_date);
      
      const response = await api.post('/trip-sheets/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update record with photo URL
      handleCellEdit(record, 'photo_url', response.data.photo_url);
      message.success('Rasim muvaffaqiyatli yuklandi!');
      
    } catch (error) {
      console.error('Photo upload error:', error);
      message.error('Rasim yuklashda xatolik');
    }
  };

  const exportToExcel = async () => {
    try {
      setLoading(true);
      
      const response = await api.get(`/trip-sheets/export/${vehicleId}`, {
        params: {
          month: selectedMonth.format('YYYY-MM'),
          format: 'excel'
        },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `kartochka_${vehicle?.plate_number}_${selectedMonth.format('YYYY-MM')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('Excel fayl muvaffaqiyatli yuklandi!');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Export qilishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const printCard = () => {
    window.print();
  };

  // Auto-save Indicator Component
  const AutoSaveIndicator = () => {
    const getIndicatorText = () => {
      switch (saveStatus) {
        case 'saving':
          return 'Saqlanmoqda...';
        case 'error':
          return 'Xatolik!';
        default:
          return 'Saqlandi';
      }
    };

    const getIndicatorIcon = () => {
      switch (saveStatus) {
        case 'saving':
          return <ReloadOutlined className="indicator-icon" spin />;
        case 'error':
          return <ExclamationCircleOutlined />;
        default:
          return <CheckCircleOutlined />;
      }
    };

    if (!hasUnsavedChanges && saveStatus === 'saved') return null;

    return (
      <div className={`auto-save-indicator ${saveStatus}`}>
        {getIndicatorIcon()}
        {getIndicatorText()}
      </div>
    );
  };

  // Enhanced Photo Upload Component
  const EnhancedPhotoUpload = ({ day, onUpload }) => {
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleDrop = async (e) => {
      e.preventDefault();
      setDragOver(false);
      
      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find(file => file.type.startsWith('image/'));
      
      if (imageFile) {
        await uploadPhoto(imageFile);
      }
    };

    const uploadPhoto = async (file) => {
      try {
        setUploading(true);
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('vehicle_id', vehicleId);
        formData.append('date', selectedMonth.clone().date(day).format('YYYY-MM-DD'));

        const response = await api.post('/trip-sheets/upload-photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        message.success('Rasim muvaffaqiyatli yuklandi!');
        onUpload && onUpload(response.data.photo_url);
      } catch (error) {
        console.error('Rasim yuklashda xatolik:', error);
        message.error('Rasim yuklashda xatolik yuz berdi');
      } finally {
        setUploading(false);
      }
    };

    return (
      <div 
        className={`enhanced-photo-upload ${dragOver ? 'dragover' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById(`photo-input-${day}`).click()}
      >
        <input 
          id={`photo-input-${day}`}
          type="file" 
          accept="image/*" 
          style={{ display: 'none' }}
          onChange={(e) => e.target.files[0] && uploadPhoto(e.target.files[0])}
        />
        {uploading ? (
          <div>
            <CloudUploadOutlined style={{ fontSize: 24, color: '#667eea' }} />
            <div>Yuklanmoqda...</div>
          </div>
        ) : (
          <div>
            <PictureOutlined style={{ fontSize: 24, color: '#667eea' }} />
            <div>Rasim yuklang yoki shu yerga tashlang</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              PNG, JPG, JPEG formatlarida
            </div>
          </div>
        )}
      </div>
    );
  };



  // Context Menu Component
  const ContextMenu = () => {
    if (!contextMenu) return null;

    return (
      <div 
        className="context-menu"
        style={{ 
          left: contextMenu.x, 
          top: contextMenu.y 
        }}
      >
        <div className="context-menu-item" onClick={() => handleCellEditMode(contextMenu.record, contextMenu.field)}>
          <EditOutlined />
          Tahrirlash
        </div>
        <div className="context-menu-item" onClick={() => handleClearCell(contextMenu.record, contextMenu.field)}>
          <DeleteOutlined />
          Tozalash
        </div>
        <div className="context-menu-item" onClick={() => handleCopyCell(contextMenu.record, contextMenu.field)}>
          <CopyOutlined />
          Nusxalash
        </div>
        <div className="context-menu-item danger" onClick={() => handleBulkClear(contextMenu.record.key)}>
          <ExclamationCircleOutlined />
          Qatorni tozalash
        </div>
      </div>
    );
  };

  // Context menu handlers
  const handleCellEditMode = (record, field) => {
    setEditingCell(`${record.key}_${field}`);
    setTempValue(record[field] || '');
    setContextMenu(null);
  };

  const handleClearCell = (record, field) => {
    handleCellEdit(record, field, '');
    setContextMenu(null);
  };

  const handleCopyCell = async (record, field) => {
    try {
      await navigator.clipboard.writeText(record[field] || '');
      message.success('Nusxalandi!');
    } catch (error) {
      message.error('Nusxalashda xatolik');
    }
    setContextMenu(null);
  };

  const handleBulkClear = (dayKey) => {
    const newData = monthlyData.map(item => 
      item.key === dayKey 
        ? { ...item, trip_number: '', driver_id: null, loader1_id: null, loader2_id: null }
        : item
    );
    setMonthlyData(newData);
    setHasUnsavedChanges(true);
    setContextMenu(null);
    message.success('Qator tozalandi!');
  };

  // Column resizing functionality
  const handleColumnResize = (columnKey, width) => {
    setColumnWidths(prev => ({
      ...prev,
      [columnKey]: width
    }));
  };

  const ResizableTitle = ({ onResize, width, ...restProps }) => {
    if (!width) {
      return <th {...restProps} />;
    }
    
    return (
      <th
        {...restProps}
        style={{
          ...restProps.style,
          width: width,
          minWidth: width,
          position: 'relative'
        }}
      >
        {restProps.children}
        <div
          style={{
            position: 'absolute',
            right: -5,
            top: 0,
            bottom: 0,
            width: 10,
            cursor: 'col-resize',
            zIndex: 1
          }}
          onMouseDown={(e) => {
            const startX = e.pageX;
            const startWidth = width;
            
            const handleMouseMove = (e) => {
              const newWidth = Math.max(50, startWidth + (e.pageX - startX));
              onResize(newWidth);
            };
            
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />
      </th>
    );
  };

  // Night shift management functions
  const addNightShift = (afterDay) => {
    const dayRecord = monthlyData.find(record => record.key === afterDay);
    if (!dayRecord) return;
    
    const nightShiftData = {
      key: `${afterDay}_night`,
      date: `${afterDay}-${afterDay + 1}`,
      day_name: 'Tungi',
      trip_number: '',
      driver_name: 'Tungi haydovchi',
      driver_id: null,
      
      // Inherit from day record - spidometr mantigi
      // Tungi smena chiqishi = oldingi kun qaytishi
      odometer_start: (dayRecord.odometer_start + (dayRecord.daily_km_manual || 0)) || dayRecord.odometer_end || 0,
      odometer_end: (dayRecord.odometer_start + (dayRecord.daily_km_manual || 0)) || dayRecord.odometer_end || 0,
      calculated_start: (dayRecord.odometer_start + (dayRecord.daily_km_manual || 0)) || dayRecord.odometer_end || 0,
      speedometer_start: (dayRecord.odometer_start + (dayRecord.daily_km_manual || 0)) || dayRecord.odometer_end || 0, 
      speedometer_end: (dayRecord.odometer_start + (dayRecord.daily_km_manual || 0)) || dayRecord.odometer_end || 0,
      calculated_speedometer_start: (dayRecord.odometer_start + (dayRecord.daily_km_manual || 0)) || dayRecord.odometer_end || 0,
      fuel_start: dayRecord.fuel_end || dayRecord.fuel_start || 0,
      fuel_end: dayRecord.fuel_end || dayRecord.fuel_start || 0,
      
      loader1_id: null,
      loader1_name: '',
      loader2_id: null,
      loader2_name: '',
      
      daily_km: 0,
      daily_km_manual: 0,
      machine_hours: 0,
      waste_tbo_trips: 0,
      polygon_1: '', polygon_2: '', polygon_3: '', polygon_4: '', polygon_5: '',
      waste_volume_m3: 0,
      waste_volume_calculated: 0,
      waste_volume_manual: 0,
      
      // Volume breakdown for night shift
      volume_breakdown: {
        mahalla: 0,
        tashkilot: 0,
        msp: 0,
        boshqa: 0
      },
      
      fuel_remaining_start: dayRecord.fuel_remaining_end || 0,
      fuel_station: '', fuel_station_id: null, fuel_taken: 0, fuel_remaining_end: 0,
      fuel_sources: [], // Multiple fuel sources
      
      weather_temp: dayRecord.weather_temp,
      weather_condition: dayRecord.weather_condition,
      is_weekend: false,
      is_today: false,
      is_night_shift: true,
      status: 'pending'
    };
    
    const newNightShifts = [...nightShifts, { afterDay, data: nightShiftData }];
    setNightShifts(newNightShifts);
    
    // Keyingi kunning spidometr boshlanishini tungi smena oxiriga moslash
    const nextDayIndex = afterDay + 1;
    const nextDayRecord = monthlyData.find(item => item.key === nextDayIndex);
    if (nextDayRecord) {
      const newData = monthlyData.map(item => 
        item.key === nextDayIndex 
          ? { 
              ...item, 
              odometer_start: nightShiftData.odometer_end,
              calculated_start: nightShiftData.odometer_end,
              speedometer_start: nightShiftData.speedometer_end,
              calculated_speedometer_start: nightShiftData.speedometer_end
            }
          : item
      );
      setMonthlyData(newData);
    }
    
    setHasUnsavedChanges(true);
    message.success(`${afterDay}-${afterDay + 1} kunlar orasiga tungi smena qo'shildi!`);
  };
  
  const removeNightShift = (afterDay) => {
    // Olib tashlanadigan tungi smenani topish
    const removingNightShift = nightShifts.find(shift => shift.afterDay === afterDay);
    
    const newNightShifts = nightShifts.filter(shift => shift.afterDay !== afterDay);
    setNightShifts(newNightShifts);
    
    // Keyingi kunning spidometr boshlanishini asl kun oxiriga qaytarish
    if (removingNightShift) {
      const dayRecord = monthlyData.find(item => item.key === afterDay);
      const nextDayIndex = afterDay + 1;
      const nextDayRecord = monthlyData.find(item => item.key === nextDayIndex);
      
      if (dayRecord && nextDayRecord) {
        const newData = monthlyData.map(item => 
          item.key === nextDayIndex 
            ? { 
                ...item, 
                odometer_start: dayRecord.odometer_end || dayRecord.odometer_start,
                calculated_start: dayRecord.odometer_end || dayRecord.odometer_start,
                speedometer_start: dayRecord.odometer_end || dayRecord.odometer_start,
                calculated_speedometer_start: dayRecord.odometer_end || dayRecord.odometer_start
              }
            : item
        );
        setMonthlyData(newData);
      }
    }
    
    setHasUnsavedChanges(true);
    message.success('Tungi smena olib tashlandi!');
  };

  // Fuel sources modal functions
  const handleFuelSourcesSave = (fuelSources) => {
    const totalFuelTaken = fuelSources.reduce((sum, source) => sum + (source.amount || 0), 0);
    const newData = monthlyData.map(item => 
      item.key === selectedFuelRecord.key 
        ? { 
            ...item, 
            fuel_sources: fuelSources,
            fuel_taken: totalFuelTaken
          }
        : item
    );
    setMonthlyData(newData);
    setHasUnsavedChanges(true);
    setFuelModalVisible(false);
    setSelectedFuelRecord(null);
    message.success('Yoqilg\'i ma\'lumotlari saqlandi!');
  };

  const FuelSourcesModal = () => {
    const [tempFuelSources, setTempFuelSources] = useState([]);

    useEffect(() => {
      if (selectedFuelRecord && fuelModalVisible) {
        setTempFuelSources(selectedFuelRecord.fuel_sources || [
          { station_id: null, station_name: '', amount: 0 }
        ]);
      }
    }, [selectedFuelRecord, fuelModalVisible]);

    const updateFuelSource = (index, field, value) => {
      const newSources = [...tempFuelSources];
      if (field === 'station_id') {
        const station = fuelStations.find(s => s.id === value);
        newSources[index] = {
          ...newSources[index],
          station_id: value,
          station_name: station ? station.name : ''
        };
      } else {
        newSources[index] = {
          ...newSources[index],
          [field]: value
        };
      }
      setTempFuelSources(newSources);
    };

    const addFuelSource = () => {
      setTempFuelSources([...tempFuelSources, { station_id: null, station_name: '', amount: 0 }]);
    };

    const removeFuelSource = (index) => {
      if (tempFuelSources.length > 1) {
        setTempFuelSources(tempFuelSources.filter((_, i) => i !== index));
      }
    };

    const totalFuel = tempFuelSources.reduce((sum, source) => sum + (source.amount || 0), 0);

    return (
      <Modal
        title={`⛽ ${selectedFuelRecord?.date}-kun yoqilg'i olindi`}
        open={fuelModalVisible}
        onCancel={() => {
          setFuelModalVisible(false);
          setSelectedFuelRecord(null);
        }}
        onOk={() => handleFuelSourcesSave(tempFuelSources)}
        okText="Saqlash"
        cancelText="Bekor qilish"
        width={400}
        styles={{ body: { padding: '16px' } }}
        className="fuel-sources-modal"
      >
        <div>
          {tempFuelSources.map((source, index) => (
            <div key={index} style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 0',
              borderBottom: index < tempFuelSources.length - 1 ? '1px solid #ecf0f1' : 'none'
            }}>
              <span style={{ fontSize: '14px', minWidth: '20px' }}>⛽</span>
              <Select
                value={source.station_id}
                onChange={(value) => updateFuelSource(index, 'station_id', value)}
                style={{ width: '150px' }}
                size="small"
                placeholder="Stansiya"
                showSearch
              >
                {fuelStations.map(station => (
                  <Option key={station.id} value={station.id}>
                    {station.name}
                  </Option>
                ))}
              </Select>
              <InputNumber
                value={source.amount || 0}
                onChange={(value) => updateFuelSource(index, 'amount', value)}
                style={{ width: '100px' }}
                min={0}
                max={999}
                precision={1}
                size="small"
                controls={false}
                addonAfter="L"
                placeholder="0.0"
              />
              {tempFuelSources.length > 1 && (
                <Button
                  size="small"
                  danger
                  onClick={() => removeFuelSource(index)}
                  style={{ minWidth: '24px', padding: '0 6px' }}
                >
                  ×
                </Button>
              )}
            </div>
          ))}
          
          {/* Qo'shish tugmasi */}
          <div style={{ marginTop: '12px' }}>
            <Button
              type="dashed"
              onClick={addFuelSource}
              style={{ width: '100%' }}
              size="small"
            >
              + Stansiya qo'shish
            </Button>
          </div>
          
          {/* Jami */}
          <div style={{ 
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            borderTop: '2px solid #2c3e50'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                ⛽ JAMI:
              </span>
              <span style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#2c3e50'
              }}>
                {totalFuel.toFixed(1)} L
              </span>
            </div>
          </div>
        </div>
      </Modal>
    );
  };

  // Volume breakdown modal functions
  const handleVolumeBreakdownSave = (breakdown) => {
    const newData = monthlyData.map(item => 
      item.key === selectedVolumeRecord.key 
        ? { ...item, volume_breakdown: breakdown }
        : item
    );
    setMonthlyData(newData);
    setHasUnsavedChanges(true);
    setVolumeModalVisible(false);
    setSelectedVolumeRecord(null);
    message.success('Hajim taqsimoti saqlandi!');
  };

  const VolumeBreakdownModal = () => {
    const [tempBreakdown, setTempBreakdown] = useState({
      mahalla: 0,
      tashkilot: 0,
      msp: 0,
      boshqa: 0
    });

    useEffect(() => {
      if (selectedVolumeRecord && volumeModalVisible) {
        setTempBreakdown(selectedVolumeRecord.volume_breakdown || {
          mahalla: 0,
          tashkilot: 0,
          msp: 0,
          boshqa: 0
        });
      }
    }, [selectedVolumeRecord, volumeModalVisible]);

    const updateBreakdown = (source, value) => {
      setTempBreakdown(prev => ({
        ...prev,
        [source]: parseFloat(value) || 0
      }));
    };

    const totalVolume = Object.values(tempBreakdown).reduce((sum, volume) => sum + (volume || 0), 0);

    return (
      <Modal
        title={`📊 ${selectedVolumeRecord?.date}-kun hajim taqsimoti`}
        open={volumeModalVisible}
        onCancel={() => {
          setVolumeModalVisible(false);
          setSelectedVolumeRecord(null);
        }}
        onOk={() => handleVolumeBreakdownSave(tempBreakdown)}
        okText="Saqlash"
        cancelText="Bekor qilish"
        width={380}
        styles={{ body: { padding: '16px' } }}
        className="volume-breakdown-modal"
      >
        <div>
          {[
            { key: 'mahalla', name: 'Mahalla', icon: '🏘️' },
            { key: 'tashkilot', name: 'Tashkilot', icon: '🏢' },
            { key: 'msp', name: 'MSP', icon: '🏭' },
            { key: 'boshqa', name: 'Boshqa', icon: '📦' }
          ].map((source, index) => (
            <div key={source.key} style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: index < 3 ? '1px solid #ecf0f1' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>{source.icon}</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>
                  {source.name}:
                </span>
              </div>
              <InputNumber
                value={tempBreakdown[source.key] || 0}
                onChange={(value) => updateBreakdown(source.key, value)}
                style={{ width: '120px' }}
                min={0}
                max={999}
                precision={1}
                size="medium"
                controls={false}
                addonAfter="m³"
                placeholder="0.0"
              />
            </div>
          ))}
          
          {/* Jami */}
          <div style={{ 
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            borderTop: '2px solid #2c3e50'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                📈 JAMI:
              </span>
              <span style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#2c3e50'
              }}>
                {totalVolume.toFixed(1)} m³
              </span>
            </div>
          </div>
        </div>
      </Modal>
    );
  };

  const EditableCell = ({ record, field, value, type = 'number', options = null, disabled = false, displayValue = null }) => {
    const isEditing = editingCell === `${record.key}_${field}`;
    const hasError = record.validation_errors?.some(error => error.includes(field));
    
    const handleRightClick = (e) => {
      e.preventDefault();
      setContextMenu({
        x: e.pageX,
        y: e.pageY,
        record,
        field
      });
    };
    
    if (disabled) {
      return (
        <div className="disabled-cell">
          {displayValue || (type === 'number' ? 
            (field.includes('odometer') ? (value || 0).toLocaleString() : (value || 0).toFixed(value === 0 ? 0 : 2)) : 
            (value || ''))}
        </div>
      );
    }
    
    if (isEditing) {
      if (options) {
        // Dropdown select
        return (
          <Select
            size="small"
            value={tempValue}
            onChange={setTempValue}
            onBlur={() => {
              handleCellEdit(record, field, tempValue);
              setEditingCell(null);
            }}
            style={{ width: '100%' }}
            autoFocus
            showSearch
            optionFilterProp="children"
          >
            {options.map(option => (
              <Option key={option.id} value={option.id} title={`${option.first_name || ''} ${option.last_name || ''} ${option.middle_name || ''}`.trim()}>
                <div style={{ padding: '4px 8px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                    {`${option.first_name || ''} ${option.last_name || ''}`.trim()}
                  </div>
                  {option.middle_name && (
                    <div style={{ fontSize: '11px', color: '#666' }}>
                      {option.middle_name}
                    </div>
                  )}
                  {option.position && (
                    <div style={{ fontSize: '10px', color: '#999' }}>
                      {option.position}
                    </div>
                  )}
                </div>
              </Option>
            ))}
          </Select>
        );
      } else if (type === 'text') {
        return (
          <Input
            size="small"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onPressEnter={() => {
              handleCellEdit(record, field, tempValue);
              setEditingCell(null);
            }}
            onBlur={() => {
              handleCellEdit(record, field, tempValue);
              setEditingCell(null);
            }}
            style={{ width: '100%' }}
            autoFocus
          />
        );
      } else {
        const maxValue = field.includes('percent') ? 200 : 
                        field.includes('odometer') ? 99999999 : 999999;
        
        return (
          <InputNumber
            size="small"
            value={tempValue}
            onChange={setTempValue}
            onPressEnter={() => {
              handleCellEdit(record, field, tempValue);
              setEditingCell(null);
            }}
            onBlur={() => {
              handleCellEdit(record, field, tempValue);
              setEditingCell(null);
            }}
            style={{ width: '100%' }}
            autoFocus
            min={0}
            max={maxValue}
            precision={type === 'decimal' ? 2 : 0}
            controls={false}
            formatter={field.includes('odometer') ? 
              value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : undefined}
            parser={field.includes('odometer') ? 
              value => value.replace(/\$\s?|(,*)/g, '') : undefined}
          />
        );
      }
    }
    
    const cellStyle = {
      cursor: 'pointer',
      padding: '2px 4px',
      minHeight: '20px',
      backgroundColor: hasError ? '#fff2f0' : 
                      record.is_weekend ? '#fff7e6' : // Hafta oxiri uchun alohida rang
                      (value > 0 ? '#f6ffed' : '#fafafa'),
      border: hasError ? '1px solid #ff4d4f' : 
              record.is_weekend ? '1px solid #ffd591' : // Hafta oxiri uchun alohida border
              '1px solid transparent',
      borderRadius: '2px'
    };
    
    return (
      <Tooltip title={hasError ? record.validation_errors.join(', ') : null}>
        <div 
          onClick={() => {
            if (!disabled) {
              setEditingCell(`${record.key}_${field}`);
              setTempValue(value);
            }
          }}
          style={cellStyle}
          className="editable-cell"
        >
          {displayValue || (type === 'number' ? 
            (field.includes('odometer') ? (value || 0).toLocaleString() : (value || 0).toFixed(value === 0 ? 0 : 2)) : 
            (value || ''))}
          {hasError && <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginLeft: 4 }} />}
        </div>
      </Tooltip>
    );
  };

  const PhotoCell = ({ record }) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {record.photo_url ? (
          <>
            <Image
              width={24}
              height={24}
              src={record.photo_url}
              preview={{
                mask: <EyeOutlined />
              }}
              style={{ borderRadius: 4 }}
            />
            <Button
              size="small"
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleCellEdit(record, 'photo_url', null)}
              danger
            />
          </>
        ) : (
          <Upload
            beforeUpload={(file) => {
              handlePhotoUpload(file, record);
              return false;
            }}
            showUploadList={false}
          >
            <Button size="small" icon={<PictureOutlined />}>
              Rasim
            </Button>
          </Upload>
        )}
      </div>
    );
  };

  // Render polygon destination inputs based on trip count
  const renderPolygonDestinations = (record) => {
    const tripCount = record.waste_tbo_trips || 0;
    if (tripCount === 0) return null;
    
    const inputs = [];
    for (let i = 1; i <= tripCount; i++) {
      inputs.push(
        <div key={i} style={{ marginBottom: 4 }}>
          <EditableCell 
            record={record} 
            field={`polygon_${i}`} 
            value={record[`polygon_${i}`] || ''}
            displayValue={record[`polygon_${i}`] || `Poligon ${i}`}
            type="select" 
            options={polygonList}
          />
        </div>
      );
    }
    return <div>{inputs}</div>;
  };

  const columns = [
    {
      title: 'Sana',
      dataIndex: 'date',
      key: 'date',
      width: columnWidths['date'] || 80,
      fixed: 'left',
      onHeaderCell: (column) => ({
        width: columnWidths['date'] || 80,
        onResize: (width) => handleColumnResize('date', width),
      }),
      render: (text, record) => (
        <div 
          style={{ 
            textAlign: 'center',
            backgroundColor: record.is_night_shift ? 'rgba(139, 69, 196, 0.1)' :
                            record.is_weekend ? '#fff7e6' : 
                            (record.is_today ? '#e6f7ff' : 'transparent'),
            borderRadius: 4,
            padding: 4,
            position: 'relative'
          }}
        >
          <div style={{ 
            fontWeight: record.is_today ? 'bold' : 'normal',
            color: record.is_night_shift ? '#8b45c4' :
                   record.is_weekend ? '#fa8c16' : 
                   (record.is_today ? '#1890ff' : '#000')
          }}>
            {text}
          </div>
          <div style={{ 
            fontSize: '10px', 
            color: record.is_night_shift ? '#8b45c4' :
                   record.is_weekend ? '#fa8c16' : '#666' 
          }}>{record.day_name}</div>
          {record.is_today && <Badge status="processing" size="small" />}
          
          {/* Night shift add/remove button - eng o'ng chetda */}
          {!record.is_night_shift && typeof record.key === 'number' && (
            <div style={{ position: 'absolute', right: '2px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
              {!nightShifts.find(shift => shift.afterDay === record.key) ? (
                <Button
                  type="primary"
                  shape="circle"
                  size="small"
                  icon={<span style={{ fontSize: '14px', fontWeight: 'bold' }}>+</span>}
                  onClick={() => addNightShift(record.key)}
                  title={`${record.key}-${record.key + 1} kunlar orasiga tungi smena qo'shish`}
                  style={{ 
                    width: '18px', 
                    height: '18px', 
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 'unset',
                    padding: 0
                  }}
                >
                  +
                </Button>
              ) : (
                <Button
                  danger
                  shape="circle"
                  size="small"
                  onClick={() => removeNightShift(record.key)}
                  title="Tungi smenani olib tashlash"
                  style={{ 
                    width: '18px', 
                    height: '18px', 
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 'unset',
                    padding: 0
                  }}
                >
                  ×
                </Button>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      title: '№',
      dataIndex: 'trip_number',
      key: 'trip_number',
      width: columnWidths['trip_number'] || 70,
      onHeaderCell: (column) => ({
        width: columnWidths['trip_number'] || 70,
        onResize: (width) => handleColumnResize('trip_number', width),
      }),
      render: (text, record) => (
        <EditableCell record={record} field="trip_number" value={text} type="text" />
      )
    },
    {
      title: 'Haydovchi',
      dataIndex: 'driver_id',
      key: 'driver_id',
      width: columnWidths['driver_id'] || 140,
      onHeaderCell: (column) => ({
        width: columnWidths['driver_id'] || 140,
        onResize: (width) => handleColumnResize('driver_id', width),
      }),
      render: (driverId, record) => {
        const selectedDriver = drivers.find(d => d.id === driverId);
        const displayValue = selectedDriver ? `${selectedDriver.first_name} ${selectedDriver.last_name}` : record.driver_name;
        
        return (
          <EditableCell 
            record={record} 
            field="driver_id" 
            value={driverId || null}
            displayValue={displayValue}
            type="select" 
            options={drivers}
disabled={false}
          />
        );
      }
    },
        {
      title: 'Yuk ortuvchilar',
      width: columnWidths['yuk_ortuvchilar'] || 200,
      onHeaderCell: (column) => ({
        width: columnWidths['yuk_ortuvchilar'] || 200,
        onResize: (width) => handleColumnResize('yuk_ortuvchilar', width),
      }),
      children: [
        {
          title: '1',
          dataIndex: 'loader1_id',
          key: 'loader1_id',
          width: (columnWidths['yuk_ortuvchilar'] || 200) / 2,
          render: (loaderId, record) => {
            const selectedLoader = loaders.find(d => d.id === loaderId);
            const displayValue = selectedLoader ? `${selectedLoader.first_name} ${selectedLoader.last_name}` : record.loader1_name || '';
            
            return (
              <EditableCell 
                record={record} 
                field="loader1_id" 
                value={loaderId || null}
                displayValue={displayValue}
                type="select" 
                options={loaders}
                disabled={false}
              />
            );
          }
        },
        {
          title: '2',
          dataIndex: 'loader2_id',
          key: 'loader2_id',
          width: (columnWidths['yuk_ortuvchilar'] || 200) / 2,
          render: (loaderId, record) => {
            const selectedLoader = loaders.find(d => d.id === loaderId);
            const displayValue = selectedLoader ? `${selectedLoader.first_name} ${selectedLoader.last_name}` : record.loader2_name || '';
            
            return (
              <EditableCell 
                record={record} 
                field="loader2_id" 
                value={loaderId || null}
                displayValue={displayValue}
                type="select" 
                options={loaders}
                disabled={false}
              />
            );
          }
        }
      ]
    },
    {
      title: 'Spidometr',
      width: columnWidths['spidometr'] || 160,
      onHeaderCell: (column) => ({
        width: columnWidths['spidometr'] || 160,
        onResize: (width) => handleColumnResize('spidometr', width),
      }),
      children: [
        {
          title: <div>Chiqish<br/><span style={{ fontSize: '8px', fontWeight: 'normal' }}>(1-kun: manual, qolgani: avto)</span></div>,
          dataIndex: 'odometer_start',
          key: 'odometer_start',
          width: (columnWidths['spidometr'] || 160) / 2,
          render: (text, record) => {
            // Tungi smena uchun alohida mantiq
            if (record.is_night_shift) {
              const displayValue = record.odometer_start || record.calculated_start || 0;
              return (
                <div style={{
                  textAlign: 'center',
                  padding: '4px 8px',
                  backgroundColor: '#f0f0ff',
                  borderRadius: '4px',
                  border: '1px solid #b3b3ff',
                  fontWeight: 'bold',
                  color: '#4d4d99'
                }}>
                  {displayValue.toLocaleString()}
                  <div style={{ fontSize: '8px', color: '#6666cc', marginTop: '1px' }}>
                    tungi smena
                  </div>
                </div>
              );
            }
            
            // Oy boshidagi spidometr + oldingi kun qaytishi
            const displayValue = record.key === 1 ? 
              (monthStartOdometer || 10000) : 
              (record.calculated_start || record.odometer_start || 0);
            
            // 1-kundan keyin chiqish read-only (avtomatik hisoblanadi)
            const isReadOnly = record.key > 1 && !record.is_night_shift;
            
            if (isReadOnly) {
              return (
                <div style={{
                  textAlign: 'center',
                  padding: '4px 8px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  border: '1px solid #d9d9d9',
                  fontWeight: 'bold',
                  color: '#666'
                }}>
                  {displayValue.toLocaleString()}
                  <div style={{ fontSize: '8px', color: '#999', marginTop: '1px' }}>
                    avtomatik
                  </div>
                </div>
              );
            }
            
            return (
              <EditableCell record={record} field="odometer_start" value={displayValue} />
            );
          }
        },
        {
          title: <div>Qaytish<br/><span style={{ fontSize: '8px', fontWeight: 'normal' }}>(chiqish + km)</span></div>,
          dataIndex: 'odometer_end',
          key: 'odometer_end',
          width: (columnWidths['spidometr'] || 160) / 2,
          render: (text, record) => {
            // Tungi smena uchun alohida mantiq
            if (record.is_night_shift) {
              const chiqish = record.odometer_start || record.calculated_start || 0;
              const km = record.daily_km_manual || 0;
              const qaytish = chiqish + km;
              
              // Agar KM kiritilmagan bo'lsa, tahrir qilish imkoniyati
              if (km === 0) {
                return (
                  <EditableCell 
                    record={record} 
                    field="odometer_end" 
                    value={record.odometer_end || qaytish}
                  />
                );
              }
              
              return (
                <div style={{
                  textAlign: 'center',
                  padding: '4px 8px',
                  backgroundColor: '#f0f0ff',
                  borderRadius: '4px',
                  border: '1px solid #b3b3ff',
                  fontWeight: 'bold',
                  color: km > 0 ? '#6666cc' : '#4d4d99'
                }}>
                  {qaytish.toLocaleString()}
                  <div style={{ fontSize: '8px', color: '#6666cc', marginTop: '1px' }}>
                    {chiqish.toLocaleString()}+{km} (tungi)
                  </div>
                </div>
              );
            }
            
            // Avtomatik hisob: Chiqish + KM
            const chiqish = record.odometer_start || 0;
            const km = record.daily_km_manual || 0;
            const qaytish = chiqish + km;
            
            return (
              <div style={{
                textAlign: 'center',
                padding: '4px 8px',
                backgroundColor: '#f0f0f0',
                borderRadius: '4px',
                border: '1px solid #d9d9d9',
                fontWeight: 'bold',
                color: km > 0 ? '#1890ff' : '#666'
              }}>
                {qaytish.toLocaleString()}
                <div style={{ fontSize: '8px', color: '#999', marginTop: '1px' }}>
                  {chiqish.toLocaleString()}+{km}
                </div>
              </div>
            );
          }
        }
      ]
    },
    {
      title: <div style={{ color: '#1890ff', fontWeight: 'bold' }}>KM<br/><span style={{ fontSize: '9px', fontWeight: 'normal' }}>(kiritish)</span></div>,
      dataIndex: 'daily_km',
      key: 'daily_km',
      width: columnWidths['daily_km'] || 80,
      onHeaderCell: (column) => ({
        width: columnWidths['daily_km'] || 80,
        onResize: (width) => handleColumnResize('daily_km', width),
      }),
      render: (text, record) => {
        const manualKm = record.daily_km_manual || 0;
        
        return (
          <EditableCell 
            record={record} 
            field="daily_km_manual" 
            value={manualKm}
            type="number"
          />
        );
      }
    },
    {
      title: 'Poligon safarlari',
      width: columnWidths['poligon_safarlari'] || 220,
      onHeaderCell: (column) => ({
        width: columnWidths['poligon_safarlari'] || 220,
        onResize: (width) => handleColumnResize('poligon_safarlari', width),
      }),
      children: [
        {
          title: 'Soni',
          dataIndex: 'waste_tbo_trips',
          key: 'waste_tbo_trips',
          width: (columnWidths['poligon_safarlari'] || 220) / 3,
          render: (text, record) => (
            <EditableCell record={record} field="waste_tbo_trips" value={text} />
          )
        },
        {
          title: 'Poligonlar',
          dataIndex: 'polygons',
          key: 'polygons',
          width: (columnWidths['poligon_safarlari'] || 220) * 2 / 3,
          render: (text, record) => renderPolygonDestinations(record)
        }
      ]
    },
    {
      title: 'Ish soati',
      dataIndex: 'machine_hours',
      key: 'machine_hours',
      width: columnWidths['machine_hours'] || 80,
      onHeaderCell: (column) => ({
        width: columnWidths['machine_hours'] || 80,
        onResize: (width) => handleColumnResize('machine_hours', width),
      }),
      render: (text, record) => (
        <EditableCell record={record} field="machine_hours" value={text} />
      )
    },
    {
      title: 'Hajm (m³)',
      dataIndex: 'waste_volume_m3',
      key: 'waste_volume_m3',
      width: columnWidths['waste_volume_m3'] || 100,
      onHeaderCell: (column) => ({
        width: columnWidths['waste_volume_m3'] || 100,
        onResize: (width) => handleColumnResize('waste_volume_m3', width),
      }),
      render: (text, record) => {
        const trips = record.waste_tbo_trips || 0;
        const vehicleCapacity = vehicle?.capacity || 7;
        const calculatedVolume = trips * vehicleCapacity;
        const manualVolume = record.waste_volume_manual || 0;
        const displayVolume = manualVolume > 0 ? manualVolume : calculatedVolume;
        
        // Calculate total from breakdown
        const breakdown = record.volume_breakdown || {
          mahalla: 0,
          tashkilot: 0,
          msp: 0,
          boshqa: 0
        };
        
        const totalBreakdownVolume = Object.values(breakdown).reduce((sum, volume) => sum + (volume || 0), 0);
        const finalVolume = totalBreakdownVolume > 0 ? totalBreakdownVolume : displayVolume;
        
        return (
          <div 
            style={{ 
              cursor: 'pointer', 
              textAlign: 'center',
              padding: '8px',
              borderRadius: '8px',
              background: totalBreakdownVolume > 0 
                ? 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: totalBreakdownVolume > 0 
                ? '2px solid #667eea' 
                : '1px solid #dee2e6',
              boxShadow: totalBreakdownVolume > 0 
                ? '0 2px 8px rgba(102, 126, 234, 0.15)' 
                : '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              position: 'relative',
              minHeight: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => {
              setSelectedVolumeRecord(record);
              setVolumeModalVisible(true);
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.25)';
              e.target.style.borderColor = '#667eea';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = totalBreakdownVolume > 0 
                ? '0 2px 8px rgba(102, 126, 234, 0.15)' 
                : '0 1px 3px rgba(0,0,0,0.1)';
              e.target.style.borderColor = totalBreakdownVolume > 0 ? '#667eea' : '#dee2e6';
            }}
            title="Hajim taqsimotini ko'rish uchun bosing"
          >
            <div style={{ 
              fontWeight: '700', 
              fontSize: '16px', 
              color: totalBreakdownVolume > 0 ? '#667eea' : '#2c3e50',
              display: 'flex',
              alignItems: 'baseline',
              gap: '2px'
            }}>
              {finalVolume.toFixed(1)}
              <span style={{ 
                fontSize: '12px', 
                fontWeight: '500',
                color: '#6c757d'
              }}>
                m³
              </span>
            </div>
            {totalBreakdownVolume > 0 && (
              <div style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '6px',
                height: '6px',
                backgroundColor: '#667eea',
                borderRadius: '50%'
              }} />
            )}
          </div>
        );
      }
    },
    {
      title: 'Yoqilg\'i',
      width: columnWidths['yoqilgi'] || 320,
      onHeaderCell: (column) => ({
        width: columnWidths['yoqilgi'] || 320,
        onResize: (width) => handleColumnResize('yoqilgi', width),
      }),
      children: [
        {
          title: <div>Qoldiq<br/>boshi</div>,
          dataIndex: 'fuel_remaining_start',
          key: 'fuel_remaining_start', 
          width: (columnWidths['yoqilgi'] || 320) / 4,
          render: (text, record) => (
            <EditableCell record={record} field="fuel_remaining_start" value={text} />
          )
        },

        {
          title: 'Olindi',
          dataIndex: 'fuel_taken',
          key: 'fuel_taken',
          width: (columnWidths['yoqilgi'] || 320) / 4,
          render: (text, record) => {
            const fuelSources = record.fuel_sources || [];
            const totalFuel = fuelSources.reduce((sum, source) => sum + (source.amount || 0), 0);
            const displayFuel = totalFuel > 0 ? totalFuel : (text || 0);
            
            return (
              <div 
                style={{ 
                  cursor: 'pointer', 
                  textAlign: 'center',
                  padding: '8px',
                  borderRadius: '8px',
                  background: totalFuel > 0 
                    ? 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                    : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  border: totalFuel > 0 
                    ? '2px solid #667eea' 
                    : '1px solid #dee2e6',
                  boxShadow: totalFuel > 0 
                    ? '0 2px 8px rgba(102, 126, 234, 0.15)' 
                    : '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  minHeight: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => {
                  setSelectedFuelRecord(record);
                  setFuelModalVisible(true);
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.25)';
                  e.target.style.borderColor = '#667eea';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = totalFuel > 0 
                    ? '0 2px 8px rgba(102, 126, 234, 0.15)' 
                    : '0 1px 3px rgba(0,0,0,0.1)';
                  e.target.style.borderColor = totalFuel > 0 ? '#667eea' : '#dee2e6';
                }}
                title="Yoqilg'i ma'lumotlarini ko'rish uchun bosing"
              >
                <div style={{ 
                  fontWeight: '700', 
                  fontSize: '16px', 
                  color: totalFuel > 0 ? '#667eea' : '#2c3e50',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '2px'
                }}>
                  {displayFuel.toFixed(1)}
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: '500',
                    color: '#6c757d'
                  }}>
                    L
                  </span>
                </div>
                {fuelSources.length > 1 && (
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#e74c3c',
                    borderRadius: '50%'
                  }} />
                )}
                {fuelSources.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    left: '2px',
                    fontSize: '8px',
                    color: '#7f8c8d'
                  }}>
                    {fuelSources.length}
                  </div>
                )}
              </div>
            );
          }
        },
        {
          title: <div>Norma<br/>sarfi</div>,
          dataIndex: 'fuel_norm_consumption',
          key: 'fuel_norm_consumption',
          width: (columnWidths['yoqilgi'] || 320) / 4,
          render: (text, record) => {
            // Avtomatik norma hisobi
            const dailyKm = Math.max(0, (record.odometer_end || 0) - (record.odometer_start || 0));
            const trips = record.waste_tbo_trips || 0;
            const vehicleNormPer100km = vehicle?.fuel_norm_per_100km || 27; // Default 27l/100km
            const tripFuelNorm = vehicle?.fuel_norm_per_trip || 2; // Default 2l/trip
            
            // Base calculation
            const kmNorm = (dailyKm / 100) * vehicleNormPer100km;
            const tripNorm = trips * tripFuelNorm;
            let totalNorm = kmNorm + tripNorm;
            
            // Weather adjustment: +5% if temperature below 0°C
            const temp = record.weather_temp || 0;
            let weatherAdjustment = 0;
            if (temp < 0) {
              weatherAdjustment = totalNorm * 0.05; // 5% increase for cold weather
              totalNorm += weatherAdjustment;
            }
            
            return (
              <div style={{ textAlign: 'center', fontSize: '10px' }}>
                <div style={{ fontWeight: 'bold', color: '#1890ff', marginBottom: '2px' }}>
                  {totalNorm.toFixed(1)}л
                </div>
                <div style={{ fontSize: '8px', color: '#666', lineHeight: '1.2' }}>
                  {kmNorm.toFixed(1)}+{tripNorm.toFixed(1)}
                  {weatherAdjustment > 0 && (
                    <div style={{ color: '#ff4d4f', fontSize: '7px' }}>
                      +{weatherAdjustment.toFixed(1)}л ({temp}°C)
                    </div>
                  )}
                  {temp !== null && temp >= 0 && (
                    <div style={{ color: '#52c41a', fontSize: '7px' }}>
                      {temp}°C
                    </div>
                  )}
                </div>
              </div>
            );
          }
        },
        {
          title: <div>Qoldiq<br/>oxiri</div>,
          dataIndex: 'fuel_remaining_end',
          key: 'fuel_remaining_end',
          width: (columnWidths['yoqilgi'] || 320) / 4,
          render: (text, record) => (
            <EditableCell record={record} field="fuel_remaining_end" value={text} />
          )
        }
      ]
    }
  ];

  const monthTotal = [...monthlyData, ...nightShifts.map(shift => shift.data)].reduce((total, day) => {
    // Qaytishni avtomatik hisoblash: chiqish + km
    const calculatedOdometerEnd = day.is_night_shift 
      ? (day.speedometer_start || 0) + (day.daily_km_manual || 0)
      : (day.odometer_start || 0) + (day.daily_km_manual || 0);
    const dayDistance = day.daily_km_manual || 0;
    
    return {
      tripNumbers: total.tripNumbers + (day.trip_number ? 1 : 0),
      odometer_start: total.odometer_start || monthStartOdometer,
      odometer_end: Math.max(total.odometer_end, calculatedOdometerEnd),
      trips: total.trips + (day.waste_tbo_trips || 0),
      machine_hours: total.machine_hours + (day.machine_hours || 0),
      waste_volume: total.waste_volume + (day.waste_volume_m3 || 0),
      fuel_remaining_start: total.fuel_remaining_start + (day.fuel_remaining_start || 0),
      fuel_taken: total.fuel_taken + (day.fuel_taken || 0),
      fuel_remaining_end: total.fuel_remaining_end + (day.fuel_remaining_end || 0),
      distance: total.distance + dayDistance
    };
  }, { 
    tripNumbers: 0, 
    odometer_start: monthStartOdometer, 
    odometer_end: 0, 
    trips: 0, 
    machine_hours: 0, 
    waste_volume: 0, 
    fuel_remaining_start: 0, 
    fuel_taken: 0, 
    fuel_remaining_end: 0, 
    distance: 0 
  });

  if (loading && !vehicle) {
    return <Spin size="large" style={{ display: 'block', textAlign: 'center', padding: '100px' }} />;
  }

  return (
    <div className="vehicle-monthly-card-fullscreen" onClick={() => setContextMenu(null)}>
      {/* Context Menu */}
      <ContextMenu />
      
      {/* Volume Breakdown Modal */}
      <VolumeBreakdownModal />
      
      {/* Fuel Sources Modal */}
      <FuelSourcesModal />
      
            <Card 
        className="header-card" 
        style={{ 
          background: '#2c3e50',
          color: 'white',
          marginBottom: 16,
          borderRadius: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        {/* Balanced Professional Header Design */}
        <div style={{ padding: '16px 0' }}>
          {/* Top Row - Navigation and Title */}
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
            <Col span={3}>
              <Button 
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/data-entry/206-report')}
                size="large"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  fontWeight: '600',
                  width: '100%'
                }}
              >
                Orqaga
              </Button>
            </Col>
            
            <Col span={6}>
              <div>
                <Title level={3} style={{ 
                  color: 'white', 
                  margin: 0,
                  fontSize: 28,
                  fontWeight: '700',
                  letterSpacing: '0.5px'
                }}>
                  {vehicle?.plate_number || 'Yuklanmoqda...'}
                </Title>
                <Text style={{ 
                  color: 'rgba(255,255,255,0.9)', 
                  fontSize: 14,
                  fontWeight: '500'
                }}>
                  {selectedMonth.format('MMMM YYYY')} oyi hisoboti
                </Text>
              </div>
            </Col>
          
            {/* Vehicle Technical Specs - Uniform Design */}
            <Col span={10}>
              <Row gutter={8}>
                <Col span={4}>
                  <div style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '8px',
                    borderRadius: 8,
                    textAlign: 'center',
                    height: 60,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>
                      Sig'im
                    </div>
                    <div style={{ fontSize: 18, fontWeight: '700', color: '#ffffff' }}>
                      {vehicle?.capacity_m3 || '--'} m³
                    </div>
                  </div>
                </Col>
                <Col span={5}>
                  <div style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '8px',
                    borderRadius: 8,
                    textAlign: 'center',
                    height: 60,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>
                      Yoqilg'i
                    </div>
                    <div style={{ fontSize: 18, fontWeight: '700', color: '#ffffff' }}>
                      {vehicle?.fuel_type?.toUpperCase() || '--'}
                    </div>
                  </div>
                </Col>
                <Col span={5}>
                  <div style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '8px',
                    borderRadius: 8,
                    textAlign: 'center',
                    height: 60,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>
                      Bak
                    </div>
                    <div style={{ fontSize: 18, fontWeight: '700', color: '#ffffff' }}>
                      {vehicle?.fuel_tank_volume || '--'} L
                    </div>
                  </div>
                </Col>
                <Col span={5}>
                  <div style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '8px',
                    borderRadius: 8,
                    textAlign: 'center',
                    height: 60,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>
                      100km sarf
                    </div>
                    <div style={{ fontSize: 18, fontWeight: '700', color: '#ffffff' }}>
                      {vehicle?.fuel_consumption_per_100km || '--'} L
                    </div>
                  </div>
                </Col>
                <Col span={5}>
                  <div style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '8px',
                    borderRadius: 8,
                    textAlign: 'center',
                    height: 60,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>
                      Qatnov
                    </div>
                    <div style={{ fontSize: 18, fontWeight: '700', color: '#ffffff' }}>
                      {vehicle?.trip_consumption || '--'} L
                    </div>
                  </div>
                </Col>
              </Row>
            </Col>
          
                      {/* Date Picker and Controls */}
            <Col span={5}>
              <DatePicker
                value={selectedMonth}
                onChange={setSelectedMonth}
                picker="month"
                format="MM.YYYY"
                placeholder="Oy tanlang"
                size="large"
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  borderColor: 'rgba(255, 255, 255, 0.3)'
                }}
                className="custom-dark-datepicker"
              />
            </Col>
            
            {/* Action Buttons */}
            <Col span={11}>
              <Space size={8}>
                <Button
                  type={autoSaveEnabled ? 'primary' : 'default'}
                  onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                  size="large"
                  style={{
                    backgroundColor: autoSaveEnabled 
                      ? 'rgba(255, 255, 255, 0.3)' 
                      : 'rgba(255, 255, 255, 0.15)',
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    color: 'white',
                    fontWeight: '600'
                  }}
                >
                  {autoSaveEnabled ? 'Avto saqlash' : 'Avto o\'chiq'}
                </Button>
                
                <Button 
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={() => handleSave(false)}
                  loading={loading}
                  disabled={!hasUnsavedChanges}
                  size="large"
                  style={{
                    backgroundColor: hasUnsavedChanges 
                      ? 'rgba(255, 255, 255, 0.3)' 
                      : 'rgba(255, 255, 255, 0.15)',
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    color: 'white',
                    fontWeight: '700'
                  }}
                >
                  Saqlash
                </Button>
                
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={exportToExcel}
                  loading={loading}
                  size="large"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white'
                  }}
                >
                  Excel
                </Button>
                
                <Button 
                  icon={<PrinterOutlined />}
                  onClick={printCard}
                  size="large"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white'
                  }}
                >
                  Print
                </Button>
                
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={loadMonthlyData}
                  loading={loading}
                  size="large"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white'
                  }}
                >
                  Yangi
                </Button>
              </Space>
            </Col>
          </Row>
        </div>
        
        {/* Oylik statistika - Muvozanatli dizayn */}
        <Card style={{ 
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: 8,
          margin: 0,
          marginBottom: 12,
          padding: '12px'
        }}>
          <Row gutter={[12, 0]} align="middle">
            <Col span={3}>
              <div style={{ 
                backgroundColor: 'white',
                border: '1px solid #dee2e6',
                borderRadius: 6,
                padding: '10px',
                textAlign: 'center',
                height: 65
              }}>
                <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 4 }}>
                  Oy boshi spidometr
                </div>
                <InputNumber
                  value={monthStartOdometer || 10000}
                  onChange={setMonthStartOdometer}
                  style={{ 
                    width: '100%',
                    fontSize: '18px',
                    fontWeight: '700',
                    border: 'none',
                    textAlign: 'center',
                    color: '#2c3e50'
                  }}
                  min={0}
                  max={99999999}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  controls={false}
                  variant="borderless"
                />
              </div>
            </Col>

            <Col span={3}>
              <div style={{ 
                backgroundColor: 'white',
                border: '1px solid #dee2e6',
                borderRadius: 6,
                padding: '10px',
                textAlign: 'center',
                height: 65
              }}>
                <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 4 }}>
                  Oy boshi yoqilg'i
                </div>
                <InputNumber
                  value={monthStartFuel}
                  onChange={setMonthStartFuel}
                  style={{ 
                    width: '100%',
                    fontSize: '18px',
                    fontWeight: '700',
                    border: 'none',
                    textAlign: 'center',
                    color: '#2c3e50'
                  }}
                  min={0}
                  max={9999}
                  precision={2}
                  controls={false}
                  variant="borderless"
                />
              </div>
            </Col>
            
            <Col span={3}>
              <div style={{ backgroundColor: 'white', border: '1px solid #dee2e6', borderRadius: 6, padding: '10px', textAlign: 'center', height: 65 }}>
                <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 4 }}>Yo'l varaqlari</div>
                <div style={{ fontSize: 20, fontWeight: '700', color: '#2c3e50' }}>{monthTotal.tripNumbers || 0}</div>
              </div>
            </Col>
            
            <Col span={3}>
              <div style={{ backgroundColor: 'white', border: '1px solid #dee2e6', borderRadius: 6, padding: '10px', textAlign: 'center', height: 65 }}>
                <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 4 }}>Poligon safarlari</div>
                <div style={{ fontSize: 20, fontWeight: '700', color: '#2c3e50' }}>{monthTotal.trips || 0}</div>
              </div>
            </Col>
            
            <Col span={3}>
              <div style={{ backgroundColor: 'white', border: '1px solid #dee2e6', borderRadius: 6, padding: '10px', textAlign: 'center', height: 65 }}>
                <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 4 }}>Ish soatlari</div>
                <div style={{ fontSize: 20, fontWeight: '700', color: '#2c3e50' }}>{monthTotal.machine_hours.toFixed(1)}</div>
              </div>
            </Col>
            
            <Col span={3}>
              <div style={{ backgroundColor: 'white', border: '1px solid #dee2e6', borderRadius: 6, padding: '10px', textAlign: 'center', height: 65 }}>
                <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 4 }}>Hajm (m³)</div>
                <div style={{ fontSize: 20, fontWeight: '700', color: '#2c3e50' }}>{monthTotal.waste_volume.toFixed(1)}</div>
              </div>
            </Col>
            
            <Col span={3}>
              <div style={{ backgroundColor: 'white', border: '1px solid #dee2e6', borderRadius: 6, padding: '10px', textAlign: 'center', height: 65 }}>
                <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 4 }}>Yoqilg'i (L)</div>
                <div style={{ fontSize: 20, fontWeight: '700', color: '#2c3e50' }}>{monthTotal.fuel_taken.toFixed(1)}</div>
              </div>
            </Col>
            
            <Col span={3}>
              <div style={{ backgroundColor: 'white', border: '1px solid #dee2e6', borderRadius: 6, padding: '10px', textAlign: 'center', height: 65 }}>
                <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 4 }}>Masofa (km)</div>
                <div style={{ fontSize: 20, fontWeight: '700', color: '#2c3e50' }}>{monthTotal.distance || 0}</div>
              </div>
            </Col>
          </Row>
        </Card>
        
        {/* Standart xodimlar - Optimized Layout */}
        <Card style={{ 
          backgroundColor: '#ffffff',
          border: '1px solid #e9ecef',
          borderRadius: 8,
          marginBottom: 12,
          padding: '12px 16px'
        }}>
          <Row gutter={[12, 0]} align="middle">
            <Col span={3}>
              <Text style={{ 
                color: '#2c3e50', 
                fontWeight: '600',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                height: '100%'
              }}>
                Standart xodimlar:
              </Text>
            </Col>
            
            <Col span={7}>
              <Select
                value={defaultDriver}
                onChange={setDefaultDriver}
                style={{ width: '100%' }}
                placeholder="Haydovchini tanlang"
                showSearch
                optionFilterProp="children"
                size="middle"
              >
                {drivers.map(driver => (
                  <Option key={driver.id} value={driver.id}>
                    <Text strong>{`${driver.first_name || ''} ${driver.last_name || ''}`.trim()}</Text>
                  </Option>
                ))}
              </Select>
            </Col>
            
            <Col span={5}>
              <Select
                value={defaultLoader1}
                onChange={setDefaultLoader1}
                style={{ width: '100%' }}
                placeholder="Yuk ortuvchi 1"
                showSearch
                optionFilterProp="children"
                size="middle"
              >
                {loaders.map(loader => (
                  <Option key={loader.id} value={loader.id}>
                    <Text strong>{`${loader.first_name || ''} ${loader.last_name || ''}`.trim()}</Text>
                  </Option>
                ))}
              </Select>
            </Col>
            
            <Col span={5}>
              <Select
                value={defaultLoader2}
                onChange={setDefaultLoader2}
                style={{ width: '100%' }}
                placeholder="Yuk ortuvchi 2"
                showSearch
                optionFilterProp="children"
                size="middle"
              >
                {loaders.map(loader => (
                  <Option key={loader.id} value={loader.id}>
                    <Text strong>{`${loader.first_name || ''} ${loader.last_name || ''}`.trim()}</Text>
                  </Option>
                ))}
              </Select>
            </Col>
            
            <Col span={4}>
              <Space size={8}>
                <Button 
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => {
                    const newData = monthlyData.map(item => ({
                      ...item,
                      driver_id: defaultDriver || item.driver_id,
                      loader1_id: defaultLoader1 || item.loader1_id,
                      loader2_id: defaultLoader2 || item.loader2_id
                    }));
                    setMonthlyData(newData);
                    setHasUnsavedChanges(true);
                    message.success('Standart xodimlar o\'rnatildi!');
                  }}
                  disabled={!defaultDriver && !defaultLoader1 && !defaultLoader2}
                >
                  O'rnatish
                </Button>
                
                <Button 
                  icon={<ClearOutlined />}
                  onClick={() => {
                    setDefaultDriver(null);
                    setDefaultLoader1(null);
                    setDefaultLoader2(null);
                    message.info('Tozalandi');
                  }}
                />
              </Space>
            </Col>
          </Row>
        </Card>
        
        {/* Xatoliklar haqida ogohlantirish */}
        {monthlyData.some(record => record.validation_errors?.length > 0) && (
          <Alert
            message="Ba'zi yozuvlarda xatoliklar mavjud"
            description="Qizil ramka bilan belgilangan maydonlarni tekshirib to'g'irlang"
            type="warning"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}
      </Card>

      <Card style={{ 
        overflow: 'auto',
        margin: 0,
        borderRadius: 0,
        border: 'none',
        boxShadow: 'none'
      }}>
        <Table
          columns={columns}
          dataSource={[...monthlyData, ...nightShifts.map(shift => shift.data)].sort((a, b) => {
            // Extract day numbers for comparison
            const getDay = (record) => {
              if (typeof record.key === 'number') return record.key;
              if (typeof record.key === 'string' && record.key.includes('_night')) {
                return parseInt(record.key.split('_')[0]);
              }
              return 0;
            };
            
            const aDay = getDay(a);
            const bDay = getDay(b);
            
            // If same day, regular day comes first, then night shift
            if (aDay === bDay) {
              if (typeof a.key === 'number' && typeof b.key === 'string') return -1; // Regular day first
              if (typeof a.key === 'string' && typeof b.key === 'number') return 1;  // Night shift after
              return 0;
            }
            
            return aDay - bDay; // Sort by day number
          })}
          loading={loading}
          pagination={false}
          scroll={{ x: '100vw', y: 'calc(100vh - 300px)' }}
          size="small"
          className="monthly-table"
          bordered
          components={{
            header: {
              cell: ResizableTitle,
            },
          }}
          tableLayout="fixed"
          rowClassName={(record) => {
            let className = '';
            if (record.is_weekend) className += ' weekend-row';
            if (record.is_today) className += ' today-row';
            if (record.validation_errors?.length > 0) className += ' error-row';
            if (record.status === 'completed') className += ' completed-day';
            if (record.is_night_shift) className += ' night-shift-row';
            return className.trim();
          }}
          summary={() => (
            <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
              <Table.Summary.Cell index={0}>Jami</Table.Summary.Cell>
              <Table.Summary.Cell index={1}>{monthTotal.tripNumbers}</Table.Summary.Cell>
              <Table.Summary.Cell index={2}>-</Table.Summary.Cell>
              <Table.Summary.Cell index={3}>-</Table.Summary.Cell>
              <Table.Summary.Cell index={4}>-</Table.Summary.Cell>
              <Table.Summary.Cell index={5}>{monthStartOdometer}</Table.Summary.Cell>
              <Table.Summary.Cell index={6}>{monthTotal.odometer_end}</Table.Summary.Cell>
              <Table.Summary.Cell index={7}>{monthTotal.distance}</Table.Summary.Cell>
              <Table.Summary.Cell index={8}>{monthTotal.trips}</Table.Summary.Cell>
              <Table.Summary.Cell index={9}>-</Table.Summary.Cell>
              <Table.Summary.Cell index={10}>{monthTotal.machine_hours}</Table.Summary.Cell>
              <Table.Summary.Cell index={11}>{monthTotal.waste_volume}</Table.Summary.Cell>
              <Table.Summary.Cell index={12}>{monthTotal.fuel_remaining_start.toFixed(1)}</Table.Summary.Cell>
              <Table.Summary.Cell index={13}>{monthTotal.fuel_taken.toFixed(1)}</Table.Summary.Cell>
              <Table.Summary.Cell index={14}>-</Table.Summary.Cell>
              <Table.Summary.Cell index={15}>{monthTotal.fuel_remaining_end.toFixed(1)}</Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>
    </div>
  );
};

export default VehicleMonthlyCard;

