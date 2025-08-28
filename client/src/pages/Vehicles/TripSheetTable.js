import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Typography, 
  Tag, 
  Progress, 
  Button, 
  Space,
  DatePicker,
  Select,
  Input,
  Badge,
  Tooltip,
  Modal,
  Form,
  InputNumber,
  message,
  Popconfirm,
  Spin
} from 'antd';
import { 
  CarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  EyeOutlined,
  CalendarOutlined,
  FileTextOutlined,
  FilterOutlined,
  SearchOutlined,
  DownloadOutlined,
  PlusCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import api from '../../services/api';
import useDateStore from '../../stores/dateStore';
import { useAuthStore } from '../../stores/authStore';
import './TripSheetTable.css';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const TripSheetTable = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [tripSheets, setTripSheets] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  
  // Filters
  const [searchText, setSearchText] = useState('');
  const [selectedDate, setSelectedDate] = useState(moment());
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal for data entry
  const [editingRecord, setEditingRecord] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const { user } = useAuthStore();
  const { selectedDate: globalDate } = useDateStore();

  // Global date bilan sync qilish
  useEffect(() => {
    if (globalDate && globalDate.isValid()) {
      setSelectedDate(globalDate);
    }
  }, [globalDate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [selectedDate, user]);

  useEffect(() => {
    applyFilters();
  }, [searchText, statusFilter, vehicles, tripSheets]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const params = {
        date: selectedDate.format('YYYY-MM-DD'),
        limit: 100,
        is_active: true
      };

      console.log('Loading table data...', params);

      // Texnikalarni yuklash
      const vehiclesRes = await api.get('/technics', { params });
      const tripSheetsData = []; // Hozircha bo'sh

      const vehiclesData = vehiclesRes.data.vehicles || vehiclesRes.data || [];
      
      setVehicles(vehiclesData);
      setTripSheets(tripSheetsData);

    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = vehicles.map(vehicle => {
      const tripSheet = tripSheets.find(ts => ts.vehicle_id === vehicle.id);
      
      return {
        key: vehicle.id,
        vehicle,
        tripSheet,
        // Status calculation
        status: getTripSheetStatus(tripSheet),
        completion: getCompletionPercentage(vehicle, tripSheet),
        // Statistics
        stats: calculateStats(vehicle, tripSheet)
      };
    });

    // Search filter
    if (searchText) {
      filtered = filtered.filter(item => 
        item.vehicle.plate_number?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.vehicle.brand?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.vehicle.model?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status.key === statusFilter);
    }

    setFilteredData(filtered);
  };

  const getTripSheetStatus = (tripSheet) => {
    if (!tripSheet) {
      return { key: 'not_started', color: '#d9d9d9', text: 'Kiritilmagan', icon: <CloseCircleOutlined /> };
    }
    
    switch (tripSheet.status) {
      case 'approved':
        return { key: 'completed', color: '#52c41a', text: 'Tasdiqlangan', icon: <CheckCircleOutlined /> };
      case 'submitted':
        return { key: 'submitted', color: '#1890ff', text: 'Yuborilgan', icon: <CheckCircleOutlined /> };
      case 'draft':
        return { key: 'draft', color: '#faad14', text: 'Qoralama', icon: <EditOutlined /> };
      default:
        return { key: 'pending', color: '#fa8c16', text: 'Kutilmoqda', icon: <ExclamationCircleOutlined /> };
    }
  };

  const getCompletionPercentage = (vehicle, tripSheet) => {
    if (!tripSheet) return 0;

    let completed = 0;
    const total = 8; // Jami asosiy maydonlar

    if (tripSheet.driver_id) completed++;
    if (tripSheet.odometer_start && tripSheet.odometer_end) completed++;
    if (tripSheet.fuel_start !== null && tripSheet.fuel_end !== null) completed++;
    if (tripSheet.total_trips > 0) completed++;
    if (tripSheet.photo_url) completed++;
    if (tripSheet.loads && tripSheet.loads.length > 0) completed++;
    if (tripSheet.fuel_taken > 0) completed++;
    if (tripSheet.notes) completed++;

    return Math.round((completed / total) * 100);
  };

  const calculateStats = (vehicle, tripSheet) => {
    const stats = {
      fuel_efficiency: 'N/A',
      fuel_status: 'normal',
      distance: 'N/A',
      trips: 0,
      waste_volume: 0,
      alerts: []
    };

    if (!tripSheet) return stats;

    // Yoqilg'i samaradorligi
    if (tripSheet.fuel_consumption_actual && tripSheet.fuel_consumption_norm) {
      const efficiency = (tripSheet.fuel_consumption_actual / tripSheet.fuel_consumption_norm) * 100;
      stats.fuel_efficiency = `${efficiency.toFixed(1)}%`;
      
      if (efficiency > 110) {
        stats.fuel_status = 'over';
        stats.alerts.push('Yoqilg\'i normadan ko\'p');
      } else if (efficiency < 90) {
        stats.fuel_status = 'under';
        stats.alerts.push('Yoqilg\'i normadan kam');
      }
    }

    // Masofa
    if (tripSheet.odometer_start && tripSheet.odometer_end) {
      stats.distance = `${(tripSheet.odometer_end - tripSheet.odometer_start)} km`;
    }

    // Jo'nalishlar
    stats.trips = tripSheet.total_trips || 0;

    // Axlat hajmi
    if (tripSheet.loads) {
      stats.waste_volume = tripSheet.loads.reduce((sum, load) => 
        sum + (load.tbo_volume_m3 || 0) + (load.smet_volume_m3 || 0), 0
      );
    }

    // Boshqa alerts
    if (!tripSheet.photo_url) {
      stats.alerts.push('Rasim yuklanmagan');
    }

    if (stats.trips === 0) {
      stats.alerts.push('Jo\'nalishlar kiritilmagan');
    }

    return stats;
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setModalVisible(true);
    
    // Form values
    if (record.tripSheet) {
      form.setFieldsValue({
        driver_id: record.tripSheet.driver_id,
        odometer_start: record.tripSheet.odometer_start,
        odometer_end: record.tripSheet.odometer_end,
        fuel_start: record.tripSheet.fuel_start,
        fuel_taken: record.tripSheet.fuel_taken,
        fuel_consumption_actual: record.tripSheet.fuel_consumption_actual,
        total_trips: record.tripSheet.total_trips,
        notes: record.tripSheet.notes
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        vehicle_id: record.vehicle.id,
        date: selectedDate.format('YYYY-MM-DD')
      });
    }
  };

  const handleSave = async (values) => {
    try {
      setLoading(true);
      
      const data = {
        ...values,
        vehicle_id: editingRecord.vehicle.id,
        date: selectedDate.format('YYYY-MM-DD')
      };

      if (editingRecord.tripSheet) {
        // Update existing
        await api.put(`/trip-sheets/${editingRecord.tripSheet.id}`, data);
        message.success('Ma\'lumot yangilandi!');
      } else {
        // Create new
        await api.post('/trip-sheets', data);
        message.success('Ma\'lumot saqlandi!');
      }

      setModalVisible(false);
      form.resetFields();
      await loadData(); // Reload data
      
    } catch (error) {
      console.error('Save error:', error);
      message.error('Saqlashda xatolik: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Texnika',
      key: 'vehicle',
      fixed: 'left',
      width: 200,
      render: (_, record) => (
        <div 
          className="vehicle-info clickable-vehicle"
          onClick={() => navigate(`/data-entry/vehicle-card/${record.vehicle.id}`)}
        >
          <div className="vehicle-header">
            <CarOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            <Text strong style={{ fontSize: 16 }}>
              {record.vehicle.plate_number}
            </Text>
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.vehicle.brand} {record.vehicle.model}
          </Text>
          <div style={{ marginTop: 4 }}>
            <Tag color="blue" size="small">
              {record.vehicle.fuel_type || 'Diesel'}
            </Tag>
            <Tag color="green" size="small">
              {record.vehicle.waste_capacity_m3 || '0'}m³
            </Tag>
          </div>
        </div>
      )
    },
    {
      title: 'Holat',
      key: 'status',
      width: 120,
      render: (_, record) => (
        <div className="status-column">
          <Tag 
            color={record.status.color}
            icon={record.status.icon}
            style={{ marginBottom: 4 }}
          >
            {record.status.text}
          </Tag>
          <Progress 
            percent={record.completion} 
            size="small" 
            strokeColor={record.status.color}
            showInfo={false}
          />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.completion}% to'ldirildi
          </Text>
        </div>
      )
    },
    {
      title: 'Yoqilg\'i',
      key: 'fuel',
      width: 150,
      render: (_, record) => {
        const { fuel_efficiency, fuel_status } = record.stats;
        const color = fuel_status === 'over' ? 'red' : fuel_status === 'under' ? 'orange' : 'green';
        
        return (
          <div className="fuel-column">
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Text style={{ color }}>
                {fuel_efficiency}
              </Text>
              {fuel_status !== 'normal' && (
                <ExclamationCircleOutlined style={{ color, fontSize: 12 }} />
              )}
            </div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Norma nisbati
            </Text>
          </div>
        );
      }
    },
    {
      title: 'Masofa',
      key: 'distance',
      width: 100,
      render: (_, record) => (
        <div className="distance-column">
          <Text strong>{record.stats.distance}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.stats.trips} jo'nalish
          </Text>
        </div>
      )
    },
    {
      title: 'Axlat (m³)',
      key: 'waste',
      width: 100,
      render: (_, record) => (
        <div className="waste-column">
          <Text strong>{record.stats.waste_volume.toFixed(1)}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            Jami hajm
          </Text>
        </div>
      )
    },
    {
      title: 'Ogohlik',
      key: 'alerts',
      width: 150,
      render: (_, record) => (
        <div className="alerts-column">
          {record.stats.alerts.length === 0 ? (
            <Tag color="green" size="small">
              <CheckCircleOutlined /> Hammasi OK
            </Tag>
          ) : (
            record.stats.alerts.map((alert, index) => (
              <Tag color="orange" size="small" key={index} style={{ marginBottom: 2 }}>
                <ExclamationCircleOutlined /> {alert}
              </Tag>
            ))
          )}
        </div>
      )
    },
    {
      title: 'Amallar',
      key: 'actions',
      fixed: 'right',
      width: 140,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            <Button 
              type="primary"
              icon={<FileTextOutlined />}
              size="small"
              onClick={() => navigate(`/data-entry/vehicle-card/${record.vehicle.id}`)}
            >
              Kartochka
            </Button>
            <Button 
              type={record.tripSheet ? "default" : "dashed"}
              icon={record.tripSheet ? <EditOutlined /> : <PlusCircleOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            >
              {record.tripSheet ? 'Tahrir' : 'Kiritish'}
            </Button>
          </Space>
          {record.tripSheet && (
            <Button 
              icon={<EyeOutlined />}
              size="small"
              block
              onClick={() => navigate(`/data-entry/trip-sheet-view/${record.tripSheet.id}`)}
            >
              Ko'rish
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="trip-sheet-table">
      <Card className="header-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
              <CarOutlined /> 206 Xisoboti - Jadval ko'rinishi
            </Title>
            <Text type="secondary">
              Excel'ga o'xshash ma'lumot kiritish va ko'rish
            </Text>
          </div>
          
          <Space size="middle">
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Sanani tanlang"
              format="DD.MM.YYYY"
              prefix={<CalendarOutlined />}
            />
            <Button icon={<DownloadOutlined />}>
              Excel'ga export
            </Button>
          </Space>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <Search
            placeholder="Texnika qidirish..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            placeholder="Holat filtri"
          >
            <Option value="all">Barcha holatlar</Option>
            <Option value="completed">Tasdiqlangan</Option>
            <Option value="pending">Kutilmoqda</Option>
            <Option value="not_started">Kiritilmagan</Option>
          </Select>
          
          <div style={{ marginLeft: 'auto' }}>
            <Text type="secondary">
              Jami: <Badge count={filteredData.length} showZero style={{ backgroundColor: '#1890ff' }} />
            </Text>
          </div>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} / ${total} texnika`
          }}
          scroll={{ x: 1200 }}
          size="small"
          className="trip-sheet-table-main"
          rowClassName={(record) => {
            const alertClass = record.stats.alerts.length > 0 ? 'has-alerts' : '';
            const statusClass = `status-${record.status.key}`;
            return `${alertClass} ${statusClass}`;
          }}
        />
      </Card>

      {/* Quick Data Entry Modal */}
      <Modal
        title={
          <Space>
            <CarOutlined />
            {editingRecord?.tripSheet ? 'Ma\'lumotlarni tahrirlash' : 'Yangi ma\'lumot kiritish'}
            {editingRecord && (
              <Text type="secondary">
                - {editingRecord.vehicle.plate_number}
              </Text>
            )}
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={form.submit}
        width={800}
        loading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item 
              label="Spidometr boshi (km)" 
              name="odometer_start"
              rules={[{ required: true, message: 'Majburiy!' }]}
            >
              <InputNumber style={{ width: '100%' }} placeholder="0" />
            </Form.Item>
            
            <Form.Item 
              label="Spidometr oxiri (km)" 
              name="odometer_end"
              rules={[{ required: true, message: 'Majburiy!' }]}
            >
              <InputNumber style={{ width: '100%' }} placeholder="0" />
            </Form.Item>
            
            <Form.Item label="Yoqilg'i boshi (l)" name="fuel_start">
              <InputNumber style={{ width: '100%' }} placeholder="0" />
            </Form.Item>
            
            <Form.Item label="Olingan yoqilg'i (l)" name="fuel_taken">
              <InputNumber style={{ width: '100%' }} placeholder="0" />
            </Form.Item>
            
            <Form.Item label="Sarflangan yoqilg'i (l)" name="fuel_consumption_actual">
              <InputNumber style={{ width: '100%' }} placeholder="0" />
            </Form.Item>
            
            <Form.Item label="Jo'nalishlar soni" name="total_trips">
              <InputNumber style={{ width: '100%' }} placeholder="0" />
            </Form.Item>
          </div>
          
          <Form.Item label="Izohlar" name="notes">
            <Input.TextArea rows={3} placeholder="Qo'shimcha ma'lumotlar..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TripSheetTable;
