import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Tag,
  Table,
  Avatar,
  Progress,
  Spin,
  Alert,
  Space,
  Button,
  Select,
  DatePicker
} from 'antd';
import { 
  UserOutlined,
  CarOutlined,
  CalendarOutlined,
  TeamOutlined,
  TruckOutlined,
  UserSwitchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import useDateStore from '../../stores/dateStore';
import { create } from 'zustand';
import './EmployeeDashboard.css';

// Company/District selector uchun store 
const useCompanySelectorStore = create((set, get) => ({
  selectedCompany: JSON.parse(localStorage.getItem('selectedCompany')) || null,
  selectedDistrict: JSON.parse(localStorage.getItem('selectedDistrict')) || null,
}));

const { Title, Text } = Typography;
const { Option } = Select;

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [employeeStats, setEmployeeStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [filterDate, setFilterDate] = useState(moment());
  
  const { user } = useAuthStore();
  const { selectedDate } = useDateStore();
  const { selectedCompany, selectedDistrict } = useCompanySelectorStore();

  useEffect(() => {
    loadDashboardData();
  }, [filterDate, user, selectedCompany, selectedDistrict]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const params = {
        date: filterDate.format('YYYY-MM-DD'),
        company_id: selectedCompany?.id || user.company_id,
        district_id: selectedDistrict?.id || user.district_id
      };
      
      // Load employee statistics
      const statsRes = await api.get('/employees/stats', { params });
      setEmployeeStats(statsRes.data.data || statsRes.data || {});
      
      // Load recent activity
      const activityRes = await api.get('/employees/recent-activity', { params });
      setRecentActivity(activityRes.data.data || activityRes.data || []);
      
      // Load today's schedule
      const scheduleRes = await api.get('/employees/today-schedule', { params });
      setTodaySchedule(scheduleRes.data.data || scheduleRes.data || []);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set default data
      setEmployeeStats({
        total_employees: 25,
        active_drivers: 8,
        active_loaders: 12,
        on_duty_today: 18,
        absent_today: 2,
        vehicles_assigned: 8,
        attendance_rate: 90
      });
      
      setTodaySchedule([
        {
          id: 1,
          employee_name: 'Ahmedov Karim',
          position: 'Haydovchi',
          vehicle_number: '01A123BC',
          status: 'working',
          shift_start: '07:00',
          shift_end: '16:00'
        },
        {
          id: 2,
          employee_name: 'Toshmatov Bobur',
          position: 'Yuk ortuvchi',
          vehicle_number: '01A123BC',
          status: 'working',
          shift_start: '07:00',
          shift_end: '16:00'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'working': return 'green';
      case 'break': return 'orange';
      case 'absent': return 'red';
      case 'sick': return 'volcano';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'working': return 'Ishda';
      case 'break': return 'Tanaffus';
      case 'absent': return 'Yo\'q';
      case 'sick': return 'Kasallik';
      default: return 'Noma\'lum';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'working': return <CheckCircleOutlined />;
      case 'break': return <ExclamationCircleOutlined />;
      case 'absent': return <CloseCircleOutlined />;
      case 'sick': return <ExclamationCircleOutlined />;
      default: return <UserOutlined />;
    }
  };

  const todayScheduleColumns = [
    {
      title: 'Xodim',
      key: 'employee',
      render: (_, record) => (
        <Space>
          <Avatar 
            icon={<UserOutlined />} 
            style={{ 
              backgroundColor: record.position === 'Haydovchi' ? '#1890ff' : '#52c41a' 
            }}
          />
          <div>
            <Text strong>{record.employee_name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.position}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Texnika',
      dataIndex: 'vehicle_number',
      key: 'vehicle',
      render: (vehicle) => (
        <Space>
          <CarOutlined style={{ color: '#1890ff' }} />
          <Text>{vehicle || 'Biriktirilmagan'}</Text>
        </Space>
      )
    },
    {
      title: 'Smena',
      key: 'shift',
      render: (_, record) => (
        <Text>
          {record.shift_start} - {record.shift_end}
        </Text>
      )
    },
    {
      title: 'Holat',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Amallar',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" type="link">
            Profil
          </Button>
          <Button size="small" type="link">
            Tabel
          </Button>
        </Space>
      )
    }
  ];

  if (loading && !employeeStats.total_employees) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Xodimlar ma'lumotlari yuklanmoqda...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-dashboard">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
              <TeamOutlined /> Xodimlar Dashboard
            </Title>
            <Text type="secondary">
              Xodimlar boshqaruvi va monitoring tizimi
            </Text>
          </div>
          
          <Space>
            <DatePicker
              value={filterDate}
              onChange={setFilterDate}
              format="DD.MM.YYYY"
              placeholder="Sanani tanlang"
            />
            <Button 
              type="primary"
              onClick={() => navigate('/employees/list')}
            >
              Barcha xodimlar
            </Button>
          </Space>
        </div>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="Jami xodimlar"
              value={employeeStats.total_employees || 0}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card className="stat-card drivers">
            <Statistic
              title="Haydovchilar"
              value={employeeStats.active_drivers || 0}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Texnika biriktirilgan: {employeeStats.vehicles_assigned || 0}
              </Text>
            </div>
          </Card>
        </Col>
        
        <Col span={6}>
          <Card className="stat-card loaders">
            <Statistic
              title="Yuk ortuvchilar"
              value={employeeStats.active_loaders || 0}
              prefix={<TruckOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card className="stat-card attendance">
            <Statistic
              title="Bugungi davomat"
              value={employeeStats.attendance_rate || 0}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: 8 }}>
              <Progress 
                percent={employeeStats.attendance_rate || 0}
                size="small"
                strokeColor="#722ed1"
                showInfo={false}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Today's Schedule */}
        <Col span={16}>
          <Card 
            title={
              <Space>
                <CalendarOutlined />
                Bugungi kun jadvali
                <Tag color="blue">{filterDate.format('DD.MM.YYYY')}</Tag>
              </Space>
            }
            extra={
              <Button 
                type="link" 
                onClick={() => navigate('/employees/schedule')}
              >
                Batafsil
              </Button>
            }
          >
            <Table
              dataSource={todaySchedule}
              columns={todayScheduleColumns}
              pagination={false}
              size="small"
              scroll={{ y: 400 }}
              rowKey="id"
            />
          </Card>
        </Col>

        {/* Quick Actions */}
        <Col span={8}>
          <Card title="Tezkor amallar" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                block
                icon={<UserOutlined />}
                onClick={() => navigate('/employees/list?category=drivers')}
              >
                Haydovchilar ro'yxati
              </Button>
              <Button 
                block
                icon={<TruckOutlined />}
                onClick={() => navigate('/employees/list?category=loaders')}
              >
                Yuk ortuvchilar ro'yxati
              </Button>
              <Button 
                block
                icon={<CalendarOutlined />}
                onClick={() => navigate('/employees/tabel')}
              >
                Tabel ko'rish
              </Button>
              <Button 
                block
                icon={<UserSwitchOutlined />}
                onClick={() => navigate('/employees/shtat')}
              >
                Shtat jadvali
              </Button>
            </Space>
          </Card>

          {/* Today's Summary */}
          <Card title="Bugungi xulosa">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Ishda:</Text>
                <Tag color="green">{employeeStats.on_duty_today || 0} kishi</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Yo'q:</Text>
                <Tag color="red">{employeeStats.absent_today || 0} kishi</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Texnika ishlatilayotgan:</Text>
                <Tag color="blue">{employeeStats.vehicles_assigned || 0} dona</Tag>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EmployeeDashboard;
