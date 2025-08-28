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
  CopyOutlined
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

  const loadVehicleData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/technics/${vehicleId}`);
      setVehicle(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading vehicle:', error);
      message.error('Texnika ma\'lumotlarini yuklashda xatolik');
    } finally {
      setLoading(false);
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
          driver_name: 'Ахмадалиев К', // Default driver
          
          // Spidometr
          odometer_start: 0,
          odometer_end: 0,
          
          // Machine hours
          machine_hours: 0,
          
          // Fuel
          fuel_volume_plan: 0,
          fuel_volume_other: 0,
          fuel_volume_total: 0,
          fuel_taken: 0,
          fuel_remaining_start: 0,
          fuel_remaining_end: 0,
          
          // Waste volumes
          waste_tbo_trips: 0,
          waste_tbo_volume: 21.00, // Default capacity
          waste_smet_volume: 0,
          waste_total_volume: 21.00,
          
          // Work completed
          work_completed_m3: 0,
          work_remaining_m3: 0,
          
          // Fuel consumption
          fuel_consumed_actual: 0,
          fuel_consumed_norm: 0,
          fuel_efficiency_percent: 100,
          
          // Status
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
              odometer_start: actual.odometer_start || 0,
              odometer_end: actual.odometer_end || 0,
              fuel_taken: actual.fuel_taken || 0,
              fuel_consumed_actual: actual.fuel_consumption_actual || 0,
              waste_tbo_trips: actual.total_trips || 0,
              work_completed_m3: actual.loads?.reduce((sum, load) => 
                sum + (load.tbo_volume_m3 || 0) + (load.smet_volume_m3 || 0), 0) || 0
            });
          }
        });
      } catch (apiError) {
        console.log('No monthly data found, using defaults');
      }
      
      setMonthlyData(monthlyEntries);
      
    } catch (error) {
      console.error('Error loading monthly data:', error);
      message.error('Oylik ma\'lumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleCellEdit = (record, field, value) => {
    const newData = monthlyData.map(item => 
      item.key === record.key 
        ? { ...item, [field]: value }
        : item
    );
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
    
    // Update the state
    setMonthlyData(prev => prev.map(item => 
      item.key === record.key ? record : item
    ));
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
          message.warning('Ba\'zi yozuvlarda xatolik bor. Tekshirib ko\'ring.');
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
        message.success('Ma\'lumotlar saqlandi!');
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
    
    // Validate odometer
    if (record.odometer_end > 0 && record.odometer_start > 0) {
      if (record.odometer_end < record.odometer_start) {
        errors.push('Spidometr oxiri boshidan kichik bo\'lishi mumkin emas');
      } else {
        record.distance = record.odometer_end - record.odometer_start;
      }
    }
    
    // Validate fuel
    if (record.fuel_consumed_actual > (record.fuel_remaining_start + record.fuel_taken)) {
      errors.push('Sarflangan yoqilg\'i mavjuddan ko\'p');
    }
    
    // Validate trips
    if (record.waste_tbo_trips > 10) {
      errors.push('Jo\'nalishlar soni juda ko\'p (>10)');
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
      message.success('Rasim yuklandi!');
      
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
      
      message.success('Excel fayl yuklandi!');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Export qilishda xatolik');
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

        message.success('Rasim yuklandi!');
        onUpload && onUpload(response.data.photo_url);
      } catch (error) {
        console.error('Rasim yuklashda xatolik:', error);
        message.error('Rasim yuklashda xatolik');
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

  // Progress Tracker Component
  const ProgressTracker = () => {
    const totalDays = selectedMonth.daysInMonth();
    const completedDays = monthlyData.filter(d => d.status === 'completed').length;
    const progressPercent = Math.round((completedDays / totalDays) * 100);

    return (
      <div className="progress-tracker">
        <div className="progress-step completed">
          <CheckCircleOutlined />
          <span>{completedDays} kun tugallandi</span>
        </div>
        <div className="progress-step current">
          <CalendarOutlined />
          <span>{progressPercent}% bajarildi</span>
        </div>
        <div className="progress-step pending">
          <ExclamationCircleOutlined />
          <span>{totalDays - completedDays} kun qoldi</span>
        </div>
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
    
    if (disabled || record.is_weekend) {
      return (
        <div className="disabled-cell">
          {displayValue || (type === 'number' ? (value || 0).toFixed(value === 0 ? 0 : 2) : (value || ''))}
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
              <Option key={option.id} value={option.id}>
                {option.name || `${option.first_name} ${option.last_name}`}
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
            max={field.includes('percent') ? 200 : 999999}
            precision={type === 'decimal' ? 2 : 0}
          />
        );
      }
    }
    
    const cellStyle = {
      cursor: 'pointer',
      padding: '2px 4px',
      minHeight: '20px',
      backgroundColor: hasError ? '#fff2f0' : (value > 0 ? '#f6ffed' : '#fafafa'),
      border: hasError ? '1px solid #ff4d4f' : '1px solid transparent',
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
          {displayValue || (type === 'number' ? (value || 0).toFixed(value === 0 ? 0 : 2) : (value || ''))}
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

  const columns = [
    {
      title: 'Sana',
      dataIndex: 'date',
      key: 'date',
      width: 60,
      fixed: 'left',
      render: (text, record) => (
                  <div 
            style={{ 
              textAlign: 'center',
              backgroundColor: record.is_weekend ? '#fff7e6' : (record.is_today ? '#e6f7ff' : 'transparent'),
              borderRadius: 4,
              padding: 4
            }}
          >
            <div style={{ 
              fontWeight: record.is_today ? 'bold' : 'normal',
              color: record.is_weekend ? '#fa8c16' : (record.is_today ? '#1890ff' : '#000')
            }}>{text}</div>
            <div style={{ 
              fontSize: '10px', 
              color: record.is_weekend ? '#fa8c16' : '#666' 
            }}>{record.day_name}</div>
            {record.is_today && <Badge status="processing" size="small" />}
          </div>
      )
    },
    {
      title: 'Yo\'l varag\'i №',
      dataIndex: 'trip_number',
      key: 'trip_number',
      width: 80,
      render: (text, record) => (
        <EditableCell record={record} field="trip_number" value={text} type="text" />
      )
    },
    {
      title: 'Xaydovchi',
      dataIndex: 'driver_id',
      key: 'driver_id',
      width: 120,
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
            disabled={record.is_weekend}
          />
        );
      }
    },
    {
      title: 'Yuk ortuvchilar',
      children: [
        {
          title: 'Yuk ortuvchi 1',
          dataIndex: 'loader1_id',
          key: 'loader1_id',
          width: 100,
          render: (loaderId, record) => {
            const selectedLoader = loaders.find(d => d.id === loaderId);
            const displayValue = selectedLoader ? `${selectedLoader.first_name} ${selectedLoader.last_name}` : record.loader1_name;
            
            return (
              <EditableCell 
                record={record} 
                field="loader1_id" 
                value={loaderId || null}
                displayValue={displayValue}
                type="select" 
                options={loaders}
                disabled={record.is_weekend}
              />
            );
          }
        },
        {
          title: 'Yuk ortuvchi 2',
          dataIndex: 'loader2_id',
          key: 'loader2_id',
          width: 100,
          render: (loaderId, record) => {
            const selectedLoader = loaders.find(d => d.id === loaderId);
            const displayValue = selectedLoader ? `${selectedLoader.first_name} ${selectedLoader.last_name}` : record.loader2_name;
            
            return (
              <EditableCell 
                record={record} 
                field="loader2_id" 
                value={loaderId || null}
                displayValue={displayValue}
                type="select" 
                options={loaders}
                disabled={record.is_weekend}
              />
            );
          }
        }
      ]
    },
    {
      title: 'Spidometr',
      children: [
        {
          title: 'Chiqish',
          dataIndex: 'odometer_start',
          key: 'odometer_start',
          width: 80,
          render: (text, record) => (
            <EditableCell record={record} field="odometer_start" value={text} />
          )
        },
        {
          title: 'Qaytish',
          dataIndex: 'odometer_end',
          key: 'odometer_end',
          width: 80,
          render: (text, record) => (
            <EditableCell record={record} field="odometer_end" value={text} />
          )
        }
      ]
    },

    {
      title: 'Ish soatlari',
      dataIndex: 'machine_hours',
      key: 'machine_hours',
      width: 60,
      render: (text, record) => (
        <EditableCell record={record} field="machine_hours" value={text} />
      )
    },
    {
      title: 'Poligonga safarlari',
      children: [
        {
          title: 'Jami',
          dataIndex: 'waste_tbo_trips',
          key: 'waste_tbo_trips',
          width: 60,
          render: (text, record) => (
            <EditableCell record={record} field="waste_tbo_trips" value={text} />
          )
        },
        {
          title: 'Qo\'shimcha',
          dataIndex: 'waste_smet_volume',
          key: 'waste_smet_volume',
          width: 60,
          render: (text, record) => (
            <EditableCell record={record} field="waste_smet_volume" value={text} />
          )
        }
      ]
    },
    {
      title: 'Masofa (km)',
      children: [
        {
          title: 'Jami km',
          dataIndex: 'waste_tbo_volume',
          key: 'waste_tbo_volume',
          width: 60,
          render: (text, record) => (
            <EditableCell record={record} field="waste_tbo_volume" value={text || 21.00} />
          )
        },
        {
          title: 'Yuk bilan km',
          dataIndex: 'work_completed_m3',
          key: 'work_completed_m3',
          width: 80,
          render: (text, record) => (
            <EditableCell record={record} field="work_completed_m3" value={text} />
          )
        }
      ]
    },
    {
      title: 'Axlat miqdori',
      children: [
        {
          title: 'Hajm (m3)',
          children: [
            {
              title: 'Axlat m3',
              dataIndex: 'waste_total_volume',
              key: 'waste_total_volume',
              width: 60,
              render: (text) => <Text>{(text || 0).toFixed(2)}</Text>
            },
            {
              title: 'Changlatish m3',
              dataIndex: 'waste_smet_final',
              key: 'waste_smet_final',
              width: 60,
              render: (text, record) => (
                <EditableCell record={record} field="waste_smet_final" value={text || 0} />
              )
            }
          ]
        }
      ]
    },
    {
      title: 'Jami (tonna)',
      children: [
        {
          title: 'Axlat (t)',
          dataIndex: 'total_tbo',
          key: 'total_tbo',
          width: 60,
          render: (_, record) => (
            <Text>{((record.waste_tbo_volume || 0) * (record.waste_tbo_trips || 0)).toFixed(2)}</Text>
          )
        },
        {
          title: 'Changlatish (t)',
          dataIndex: 'total_waste',
          key: 'total_waste',
          width: 60,
          render: (_, record) => (
            <Text>{(record.work_completed_m3 || 0).toFixed(2)}</Text>
          )
        }
      ]
    },
    {
      title: 'Yoqilg\'i sarfi',
      children: [
        {
          title: 'Kun boshi qoldig\'i',
          dataIndex: 'fuel_remaining_start',
          key: 'fuel_remaining_start',
          width: 80,
          render: (text, record) => (
            <EditableCell record={record} field="fuel_remaining_start" value={text} />
          )
        },
        {
          title: 'Yoqilg\'i olindi',
          dataIndex: 'fuel_taken',
          key: 'fuel_taken',
          width: 80,
          render: (text, record) => (
            <EditableCell record={record} field="fuel_taken" value={text} />
          )
        },
        {
          title: 'Norma bo\'yicha',
          dataIndex: 'fuel_consumed_norm',
          key: 'fuel_consumed_norm',
          width: 80,
          render: (text, record) => (
            <EditableCell record={record} field="fuel_consumed_norm" value={text || 56.5} />
          )
        },
        {
          title: 'Faktik sarflar',
          children: [
            {
              title: 'Asosiy',
              dataIndex: 'fuel_consumed_actual_volume',
              key: 'fuel_consumed_actual_volume',
              width: 60,
              render: (text, record) => (
                <EditableCell record={record} field="fuel_consumed_actual_volume" value={text || record.fuel_consumed_actual} />
              )
            },
            {
              title: 'Qo\'shimcha',
              dataIndex: 'fuel_consumed_other',
              key: 'fuel_consumed_other',
              width: 60,
              render: (text, record) => (
                <EditableCell record={record} field="fuel_consumed_other" value={text || 0} />
              )
            }
          ]
        },
        {
          title: 'Kun oxiri qoldig\'i',
          dataIndex: 'fuel_remaining_end',
          key: 'fuel_remaining_end',
          width: 80,
          render: (text, record) => (
            <EditableCell record={record} field="fuel_remaining_end" value={text} />
          )
        }
      ]
    },
    {
      title: 'Rasim',
      key: 'photo',
      width: 80,
      render: (_, record) => <PhotoCell record={record} />
    },
    {
      title: 'Izohlar',
      dataIndex: 'notes',
      key: 'notes',
      width: 120,
      render: (text, record) => (
        <EditableCell 
          record={record} 
          field="notes" 
          value={text} 
          type="text"
        />
      )
    }
  ];

  const monthTotal = monthlyData.reduce((total, day) => ({
    trips: total.trips + (day.waste_tbo_trips || 0),
    fuel_taken: total.fuel_taken + (day.fuel_taken || 0),
    fuel_consumed: total.fuel_consumed + (day.fuel_consumed_actual || 0),
    waste_volume: total.waste_volume + (day.work_completed_m3 || 0),
    distance: total.distance + Math.max(0, (day.odometer_end || 0) - (day.odometer_start || 0))
  }), { trips: 0, fuel_taken: 0, fuel_consumed: 0, waste_volume: 0, distance: 0 });

  if (loading && !vehicle) {
    return <Spin size="large" style={{ display: 'block', textAlign: 'center', padding: '100px' }} />;
  }

  return (
    <div className="vehicle-monthly-card" onClick={() => setContextMenu(null)}>
      {/* Auto-save Indicator */}
      <AutoSaveIndicator />
      
      {/* Progress Tracker */}
      <ProgressTracker />
      
      {/* Context Menu */}
      <ContextMenu />
      
      <Card className="header-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/data-entry/206-report')}
              size="large"
            >
              Orqaga
            </Button>
            
            <div>
              <Title level={2} style={{ margin: 0, color: '#667eea' }}>
                <CarOutlined /> KARTOCHKA
                <Badge 
                  count={hasUnsavedChanges ? 'Saqlanmagan' : 'Saqlandi'} 
                  style={{ 
                    backgroundColor: hasUnsavedChanges ? '#f59e0b' : '#10b981',
                    fontSize: '10px',
                    height: '20px',
                    lineHeight: '20px',
                    borderRadius: '10px',
                    marginLeft: '12px'
                  }} 
                />
              </Title>
              <Text style={{ fontSize: 16 }}>
                учёта работы автомашины {vehicle?.brand} {vehicle?.model} гос № _____<strong>{vehicle?.plate_number}</strong>_______ за _____{selectedMonth.format('MM')}_____месяц {selectedMonth.format('YYYY')} год
              </Text>
            </div>
          </div>
          
          <Space>
            <DatePicker
              value={selectedMonth}
              onChange={setSelectedMonth}
              picker="month"
              format="MM.YYYY"
              placeholder="Oy tanlang"
            />
            
            <Button 
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => handleSave(false)}
              loading={loading}
              disabled={!hasUnsavedChanges}
            >
              Saqlash
            </Button>
            
            <Button 
              icon={<DownloadOutlined />}
              onClick={exportToExcel}
              loading={loading}
            >
              Excel export
            </Button>
            
            <Button 
              icon={<PrinterOutlined />}
              onClick={printCard}
            >
              Chop etish
            </Button>
            
            <Button 
              icon={<ReloadOutlined />}
              onClick={loadMonthlyData}
              loading={loading}
            >
              Yangilash
            </Button>
          </Space>
        </div>

        {/* Monthly Summary and Controls */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={3}>
            <Statistic title="Jami jo'nalishlar" value={monthTotal.trips} />
          </Col>
          <Col span={3}>
            <Statistic title="Olingan yoqilg'i (l)" value={monthTotal.fuel_taken} precision={1} />
          </Col>
          <Col span={3}>
            <Statistic title="Sarflangan (l)" value={monthTotal.fuel_consumed} precision={1} />
          </Col>
          <Col span={3}>
            <Statistic title="Axlat (m³)" value={monthTotal.waste_volume} precision={1} />
          </Col>
          <Col span={3}>
            <Statistic title="Masofa (km)" value={monthTotal.distance} />
          </Col>
          <Col span={3}>
            <Statistic 
              title="Samaradorlik %" 
              value={monthTotal.fuel_consumed > 0 ? ((monthTotal.fuel_consumed / (monthTotal.distance * 0.35)) * 100) : 0}
              precision={1}
              valueStyle={{ color: monthTotal.fuel_consumed > (monthTotal.distance * 0.4) ? '#cf1322' : '#3f8600' }}
            />
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <Space direction="vertical" size="small">
              <div>
                <Switch 
                  checked={autoSaveEnabled}
                  onChange={setAutoSaveEnabled}
                  size="small"
                />
                <Text style={{ marginLeft: 8, fontSize: 12 }}>Avtomatik saqlash</Text>
              </div>
              {hasUnsavedChanges && (
                <Badge count="Saqlanmagan" size="small" style={{ backgroundColor: '#faad14' }} />
              )}
            </Space>
          </Col>
        </Row>
        
        {/* Validation Alert */}
        {monthlyData.some(record => record.validation_errors?.length > 0) && (
          <Alert
            message="Ba'zi yozuvlarda xatoliklar bor"
            description="Qizil ramkali maydonlarni tekshirib to'g'irlang"
            type="warning"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}
      </Card>

      <Card style={{ overflow: 'auto' }}>
        <Table
          columns={columns}
          dataSource={monthlyData}
          loading={loading}
          pagination={false}
          scroll={{ x: 2000, y: 600 }}
          size="small"
          className="monthly-table"
          bordered
          rowClassName={(record) => {
            let className = '';
            if (record.is_weekend) className += ' weekend-row';
            if (record.is_today) className += ' today-row';
            if (record.validation_errors?.length > 0) className += ' error-row';
            if (record.status === 'completed') className += ' completed-day';
            return className.trim();
          }}
          summary={() => (
            <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
              <Table.Summary.Cell index={0} colSpan={3}>Итого</Table.Summary.Cell>
              <Table.Summary.Cell index={1}>{vehicle?.odometer_start || 0}</Table.Summary.Cell>
              <Table.Summary.Cell index={2}>{vehicle?.odometer_current || 0}</Table.Summary.Cell>
              <Table.Summary.Cell index={3}>{monthTotal.trips}</Table.Summary.Cell>
              <Table.Summary.Cell index={4}>0</Table.Summary.Cell>
              <Table.Summary.Cell index={5}>{monthTotal.fuel_taken.toFixed(1)}</Table.Summary.Cell>
              <Table.Summary.Cell index={6}>72</Table.Summary.Cell>
              <Table.Summary.Cell index={7}>{(monthTotal.waste_volume / 21).toFixed(0)}</Table.Summary.Cell>
              <Table.Summary.Cell index={8}>0</Table.Summary.Cell>
              <Table.Summary.Cell index={9}>0</Table.Summary.Cell>
              <Table.Summary.Cell index={10}>72</Table.Summary.Cell>
              <Table.Summary.Cell index={11}>0</Table.Summary.Cell>
              <Table.Summary.Cell index={12}>504.00</Table.Summary.Cell>
              <Table.Summary.Cell index={13}>0</Table.Summary.Cell>
              <Table.Summary.Cell index={14}>0</Table.Summary.Cell>
              <Table.Summary.Cell index={15}>0</Table.Summary.Cell>
              <Table.Summary.Cell index={16}>504.00</Table.Summary.Cell>
              <Table.Summary.Cell index={17}>{monthTotal.fuel_taken.toFixed(0)}</Table.Summary.Cell>
              <Table.Summary.Cell index={18}>{monthTotal.fuel_consumed.toFixed(2)}</Table.Summary.Cell>
              <Table.Summary.Cell index={19}>{monthTotal.distance}</Table.Summary.Cell>
              <Table.Summary.Cell index={20}>{monthTotal.distance}</Table.Summary.Cell>
              <Table.Summary.Cell index={21}>{monthTotal.fuel_consumed.toFixed(1)}</Table.Summary.Cell>
              <Table.Summary.Cell index={22}>{monthTotal.fuel_consumed.toFixed(1)}</Table.Summary.Cell>
              <Table.Summary.Cell index={23}>0</Table.Summary.Cell>
              <Table.Summary.Cell index={24}>{monthTotal.fuel_consumed.toFixed(2)}</Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>
    </div>
  );
};

export default VehicleMonthlyCard;
