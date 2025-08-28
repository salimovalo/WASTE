import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  Button, 
  Tag, 
  Avatar, 
  Progress, 
  Tooltip, 
  Space,
  DatePicker,
  Select,
  Input,
  Badge,
  Empty,
  Spin,
  message
} from 'antd';
import { 
  CarOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  EyeOutlined,
  SearchOutlined,
  CalendarOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import api from '../../services/api';
import useDateStore from '../../stores/dateStore';
import { useAuthStore } from '../../stores/authStore';
import './TripSheetList.css';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

const TripSheetList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [tripSheets, setTripSheets] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  
  // Filters
  const [searchText, setSearchText] = useState('');
  const [selectedDate, setSelectedDate] = useState(moment());
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

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
  }, [searchText, statusFilter, typeFilter, vehicles, tripSheets]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Global filtrlar - user role va company/district access
      const params = {
        date: selectedDate.format('YYYY-MM-DD'),
        limit: 100,
        is_active: true
      };

      // User role va access bo'yicha filtr (backend'da ham qo'llanadi)
      if (user?.company_id) {
        console.log('Frontend: Company filter applied:', user.company_id);
      }
      
      if (user?.district_id) {
        console.log('Frontend: District filter applied:', user.district_id);
      }

      console.log('API params:', params);
      console.log('User info:', { 
        id: user?.id, 
        role: user?.role?.name,
        company_id: user?.company_id, 
        district_id: user?.district_id,
      });

      // Texnikalarni yuklash (global filtrlar bilan)
      const vehiclesRes = await api.get('/technics', { params });
      const tripSheetsData = []; // Hozircha bo'sh

      const vehiclesData = vehiclesRes.data.vehicles || vehiclesRes.data || [];
      
      console.log('Loaded vehicles:', vehiclesData.length);
      console.log('First vehicle sample:', vehiclesData[0]);
      
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
    let filtered = [...vehicles];

    // Search filter
    if (searchText) {
      filtered = filtered.filter(vehicle => 
        vehicle.plate_number?.toLowerCase().includes(searchText.toLowerCase()) ||
        vehicle.brand?.toLowerCase().includes(searchText.toLowerCase()) ||
        vehicle.model?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vehicle => {
        const tripSheet = tripSheets.find(ts => ts.vehicle_id === vehicle.id);
        if (statusFilter === 'completed') {
          return tripSheet && tripSheet.status === 'approved';
        } else if (statusFilter === 'pending') {
          return tripSheet && tripSheet.status === 'pending';
        } else if (statusFilter === 'not_started') {
          return !tripSheet;
        }
        return true;
      });
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(vehicle => 
        vehicle.vehicle_type === typeFilter
      );
    }

    setFilteredVehicles(filtered);
  };

  const getVehicleStatus = (vehicle) => {
    const tripSheet = tripSheets.find(ts => ts.vehicle_id === vehicle.id);
    
    if (!tripSheet) {
      return { status: 'not_started', color: '#d9d9d9', text: 'Boshlanmagan' };
    }
    
    switch (tripSheet.status) {
      case 'approved':
        return { status: 'completed', color: '#52c41a', text: 'Tasdiqlangan' };
      case 'submitted':
        return { status: 'submitted', color: '#1890ff', text: 'Yuborilgan' };
      case 'draft':
        return { status: 'draft', color: '#faad14', text: 'Qoralama' };
      default:
        return { status: 'pending', color: '#fa8c16', text: 'Kutilmoqda' };
    }
  };

  const handleCreateNew = (vehicle) => {
    navigate(`/data-entry/trip-sheet-form`, {
      state: { 
        vehicleId: vehicle.id, 
        date: selectedDate.format('YYYY-MM-DD'),
        vehicle: vehicle 
      }
    });
  };

  const handleEdit = (vehicle) => {
    const tripSheet = tripSheets.find(ts => ts.vehicle_id === vehicle.id);
    navigate(`/data-entry/trip-sheet-form`, {
      state: { 
        tripSheetId: tripSheet.id,
        vehicleId: vehicle.id,
        date: selectedDate.format('YYYY-MM-DD'),
        vehicle: vehicle
      }
    });
  };

  const handleView = (vehicle) => {
    const tripSheet = tripSheets.find(ts => ts.vehicle_id === vehicle.id);
    navigate(`/data-entry/trip-sheet-view/${tripSheet.id}`);
  };

  const getCompletionPercentage = (vehicle) => {
    const tripSheet = tripSheets.find(ts => ts.vehicle_id === vehicle.id);
    if (!tripSheet) return 0;

    let completed = 0;
    const total = 6; // Jami maydonlar soni

    if (tripSheet.driver_id) completed++;
    if (tripSheet.odometer_start && tripSheet.odometer_end) completed++;
    if (tripSheet.fuel_start !== null && tripSheet.fuel_end !== null) completed++;
    if (tripSheet.total_trips > 0) completed++;
    if (tripSheet.photo_url) completed++;
    if (tripSheet.loads && tripSheet.loads.length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  return (
    <div className="trip-sheet-list">
      <Card className="header-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
              <CarOutlined /> 206 Xisoboti - Texnikalar
            </Title>
            <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
              Texnika bo'yicha kunlik ish ma'lumotlari va yo'l varaqalari
            </Paragraph>
          </div>
          
          <Space size="large">
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Sanani tanlang"
              format="DD.MM.YYYY"
              size="large"
              prefix={<CalendarOutlined />}
            />
            <Badge count={filteredVehicles.length} showZero>
              <Button icon={<FilterOutlined />} size="large">
                Texnikalar
              </Button>
            </Badge>
          </Space>
        </div>

        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8} md={6}>
            <Search
              placeholder="Texnika qidirish..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          
          <Col xs={24} sm={8} md={6}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              placeholder="Holat bo'yicha filtr"
            >
              <Option value="all">Barcha holatlar</Option>
              <Option value="completed">Tasdiqlangan</Option>
              <Option value="pending">Kutilmoqda</Option>
              <Option value="not_started">Boshlanmagan</Option>
            </Select>
          </Col>
          
          <Col xs={24} sm={8} md={6}>
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: '100%' }}
              placeholder="Turi bo'yicha filtr"
            >
              <Option value="all">Barcha turlar</Option>
              <Option value="garbage_truck">Axlat yig'uvchi</Option>
              <Option value="compactor">Siquvchi</Option>
              <Option value="loader">Yuklovchi</Option>
            </Select>
          </Col>
          
          <Col xs={24} sm={24} md={6}>
            <Text type="secondary">
              Jami: <strong>{filteredVehicles.length}</strong> ta texnika
            </Text>
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        {filteredVehicles.length === 0 ? (
          <Empty 
            description="Texnikalar topilmadi"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ margin: '60px 0' }}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {filteredVehicles.map(vehicle => {
              const status = getVehicleStatus(vehicle);
              const completion = getCompletionPercentage(vehicle);
              const tripSheet = tripSheets.find(ts => ts.vehicle_id === vehicle.id);
              
              return (
                <Col xs={24} sm={12} md={8} lg={6} key={vehicle.id}>
                  <Badge.Ribbon 
                    text={status.text}
                    color={status.color}
                    style={{ right: -5 }}
                  >
                    <Card
                      className={`vehicle-card ${status.status}`}
                      hoverable
                      cover={
                        <div className="vehicle-cover">
                          <Avatar
                            size={64}
                            icon={<CarOutlined />}
                            style={{ 
                              backgroundColor: status.color,
                              color: 'white',
                              margin: '20px auto',
                              display: 'block'
                            }}
                          />
                          {status.status === 'completed' && (
                            <CheckCircleOutlined 
                              className="status-icon completed"
                              style={{ color: '#52c41a', fontSize: 24 }}
                            />
                          )}
                        </div>
                      }
                      actions={[
                        tripSheet ? (
                          <Tooltip title="Tahrirlash">
                            <EditOutlined 
                              onClick={() => handleEdit(vehicle)}
                              style={{ color: '#1890ff' }}
                            />
                          </Tooltip>
                        ) : (
                          <Tooltip title="Ma'lumot kiritish">
                            <PlusOutlined 
                              onClick={() => handleCreateNew(vehicle)}
                              style={{ color: '#52c41a' }}
                            />
                          </Tooltip>
                        ),
                        tripSheet && (
                          <Tooltip title="Ko'rish">
                            <EyeOutlined 
                              onClick={() => handleView(vehicle)}
                              style={{ color: '#722ed1' }}
                            />
                          </Tooltip>
                        ),
                        <Tooltip title="Bajarilganlik">
                          <div style={{ textAlign: 'center' }}>
                            <Progress 
                              type="circle" 
                              percent={completion} 
                              size={24}
                              strokeColor={status.color}
                              showInfo={false}
                            />
                          </div>
                        </Tooltip>
                      ].filter(Boolean)}
                    >
                      <Card.Meta
                        title={
                          <div>
                            <Text strong style={{ fontSize: 16 }}>
                              {vehicle.plate_number}
                            </Text>
                            {status.status === 'completed' && (
                              <CheckCircleOutlined 
                                style={{ color: '#52c41a', marginLeft: 8, fontSize: 18 }}
                              />
                            )}
                          </div>
                        }
                        description={
                          <div>
                            <Text type="secondary">
                              {vehicle.brand} {vehicle.model}
                            </Text>
                            <br />
                            <Tag color="blue" style={{ marginTop: 4 }}>
                              {vehicle.fuel_type || 'Diesel'}
                            </Tag>
                            <Tag color="green">
                              {vehicle.waste_capacity_m3 || '0'}m³
                            </Tag>
                            
                            {tripSheet && (
                              <div style={{ marginTop: 12 }}>
                                <Progress 
                                  percent={completion}
                                  size="small"
                                  strokeColor={status.color}
                                  showInfo={false}
                                />
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  Bajarilganlik: {completion}%
                                </Text>
                              </div>
                            )}
                            
                            {tripSheet?.driver_id && (
                              <div style={{ marginTop: 8 }}>
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  Haydovchi: Tayinlangan
                                </Text>
                              </div>
                            )}
                          </div>
                        }
                      />
                    </Card>
                  </Badge.Ribbon>
                </Col>
              );
            })}
          </Row>
        )}
      </Spin>
    </div>
  );
};

export default TripSheetList;
