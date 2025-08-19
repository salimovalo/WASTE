import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  Statistic, 
  Progress,
  Table,
  Select,
  DatePicker,
  Space,
  Spin
} from 'antd';
import { 
  CarOutlined, 
  ApiOutlined, 
  ToolOutlined,
  BarChartOutlined,
  AlertOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Dashboard = () => {

  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState({});
  const [recentActivity] = useState([]);
  const [dateRange] = useState([]);

  // Statistikani yuklash
  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await api.get('/technics/stats/summary');
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  // Oxirgi faoliyat ustunlari
  const activityColumns = [
    {
      title: 'Sana',
      dataIndex: 'date',
      key: 'date'
    },
    {
      title: 'Texnika',
      dataIndex: 'vehicle',
      key: 'vehicle'
    },
    {
      title: 'Faoliyat',
      dataIndex: 'activity',
      key: 'activity'
    },
    {
      title: 'Holat',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span style={{ color: status === 'success' ? '#52c41a' : '#ff4d4f' }}>
          {status === 'success' ? 'Muvaffaqiyatli' : 'Xatolik'}
        </span>
      )
    }
  ];

  return (
    <div className="dashboard-page">
      <Title level={2}>
        <BarChartOutlined /> Texnikalar Dashboard
      </Title>

      <Spin spinning={loading}>
        {/* Asosiy statistika */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Jami texnikalar"
                value={statistics.totalVehicles || 0}
                prefix={<CarOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Faol texnikalar"
                value={statistics.activeVehicles || 0}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
              <Progress 
                percent={statistics.totalVehicles ? 
                  Math.round((statistics.activeVehicles / statistics.totalVehicles) * 100) : 0}
                size="small"
                strokeColor="#52c41a"
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Texnik xizmat"
                value={statistics.inactiveVehicles || 0}
                prefix={<ToolOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16' }}
              />
              <Progress 
                percent={statistics.totalVehicles ? 
                  Math.round((statistics.inactiveVehicles / statistics.totalVehicles) * 100) : 0}
                size="small"
                strokeColor="#fa8c16"
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Yoqilg'i xarajati"
                value="12,500"
                suffix="L"
                prefix={<ApiOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1' }}
              />
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                Bu oy
              </div>
            </Card>
          </Col>
        </Row>

        {/* Detallashtirilgan statistika */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card title="Texnikalar turi bo'yicha" bordered={false}>
              {statistics.vehiclesByType?.map((item, index) => (
                <div key={index} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>{item.vehicle_type}</span>
                    <span>{item.count} ta</span>
                  </div>
                  <Progress 
                    percent={statistics.totalVehicles ? 
                      Math.round((item.count / statistics.totalVehicles) * 100) : 0}
                    size="small"
                    strokeColor={['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#f5222d'][index % 5]}
                  />
                </div>
              ))}
            </Card>
          </Col>
          
          <Col xs={24} lg={12}>
            <Card title="Yoqilg'i turi bo'yicha" bordered={false}>
              {statistics.vehiclesByFuelType?.map((item, index) => (
                <div key={index} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>{item.fuel_type}</span>
                    <span>{item.count} ta</span>
                  </div>
                  <Progress 
                    percent={statistics.totalVehicles ? 
                      Math.round((item.count / statistics.totalVehicles) * 100) : 0}
                    size="small"
                    strokeColor={['#52c41a', '#1890ff', '#fa8c16', '#722ed1', '#f5222d'][index % 5]}
                  />
                </div>
              ))}
            </Card>
          </Col>
        </Row>

        {/* Ogohlantiruvlar va eslatmalar */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24}>
            <Card 
              title={
                <span>
                  <AlertOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
                  Eslatmalar va ogohlantirishlar
                </span>
              }
              bordered={false}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Card size="small" style={{ borderLeft: '4px solid #fa8c16' }}>
                    <Statistic
                      title="Texnik ko'rikdan o'tishi kerak"
                      value={3}
                      valueStyle={{ color: '#fa8c16', fontSize: 18 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card size="small" style={{ borderLeft: '4px solid #f5222d' }}>
                    <Statistic
                      title="Ishlamayotgan texnikalar"
                      value={2}
                      valueStyle={{ color: '#f5222d', fontSize: 18 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card size="small" style={{ borderLeft: '4px solid #52c41a' }}>
                    <Statistic
                      title="Bugun ishga chiqqan"
                      value={12}
                      valueStyle={{ color: '#52c41a', fontSize: 18 }}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Filter va oxirgi faoliyat */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card 
              title="Oxirgi faoliyat"
              extra={
                <Space>
                  <RangePicker 
                    value={dateRange}
                    onChange={() => {}}
                    placeholder={['Boshlanish', 'Tugash']}
                  />
                  <Select placeholder="Texnikani tanlang" style={{ width: 200 }}>
                    <Option value="all">Barcha texnikalar</Option>
                  </Select>
                </Space>
              }
            >
              <Table
                columns={activityColumns}
                dataSource={recentActivity}
                pagination={{ pageSize: 5 }}
                size="small"
                locale={{ emptyText: 'Ma\'lumot yo\'q' }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default Dashboard;
