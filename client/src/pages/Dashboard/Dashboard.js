import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Alert } from 'antd';
import {
  TeamOutlined,
  BankOutlined,
  CarOutlined,
  DollarOutlined,
  TrophyOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { useSelectedCompany } from '../../components/Layout/CompanySelector';
import { reportsAPI } from '../../services/api';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  

  const { selectedCompany, selectedDistrict } = useSelectedCompany();

  // Dashboard ma'lumotlarini yuklash
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!selectedCompany) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const params = {
          company_id: selectedCompany.id,
          ...(selectedDistrict && { district_id: selectedDistrict.id })
        };
        
        const response = await reportsAPI.getDashboardStats(params);
        setDashboardData(response.data);
      } catch (error) {
        console.error('Dashboard ma\'lumotlarini yuklashda xatolik:', error);
        setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [selectedCompany, selectedDistrict]);

  if (loading) {
    return (
      <div className="page-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Xatolik"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px 0' }}
      />
    );
  }

  if (!selectedCompany) {
    return (
      <Alert
        message="Korxona tanlanmagan"
        description="Dashboard ko'rish uchun korxonani tanlang"
        type="warning"
        showIcon
        style={{ margin: '20px 0' }}
      />
    );
  }

  // Demo ma'lumotlar (API javob kelmaguncha)
  const defaultData = {
    totalHouseholds: 1500,
    totalLegalEntities: 45,
    totalVehicles: 12,
    monthlyRevenue: 850000,
    serviceQualityScore: 4.2,
    activeDistricts: 3,
    dailyCollections: 95,
    monthlyTarget: 100
  };

  const data = dashboardData || defaultData;

  return (
    <div className="dashboard fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Bosh sahifa
        </Title>
        <Text type="secondary">
          {selectedCompany.name}
          {selectedDistrict && ` - ${selectedDistrict.name}`}
        </Text>
      </div>

      {/* Statistikalar */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8} xl={6}>
          <Card>
            <Statistic
              title="Umumiy uy xo'jaliklari"
              value={data.totalHouseholds}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={8} xl={6}>
          <Card>
            <Statistic
              title="Yuridik shaxslar"
              value={data.totalLegalEntities}
              prefix={<BankOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={8} xl={6}>
          <Card>
            <Statistic
              title="Texnika vositalari"
              value={data.totalVehicles}
              prefix={<CarOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={8} xl={6}>
          <Card>
            <Statistic
              title="Oylik daromad"
              value={data.monthlyRevenue}
              prefix={<DollarOutlined style={{ color: '#f5222d' }} />}
              suffix="so'm"
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Qo'shimcha statistikalar */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Xizmat sifati bahosi"
              value={data.serviceQualityScore}
              prefix={<TrophyOutlined style={{ color: '#722ed1' }} />}
              suffix="/ 5.0"
              precision={1}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Faol tumanlar"
              value={data.activeDistricts}
              prefix={<EnvironmentOutlined style={{ color: '#13c2c2' }} />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Kunlik yig'im"
              value={data.dailyCollections}
              suffix={`/ ${data.monthlyTarget}%`}
              valueStyle={{ 
                color: data.dailyCollections >= data.monthlyTarget ? '#52c41a' : '#faad14' 
              }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Oylik rejadan {data.dailyCollections >= data.monthlyTarget ? 'yuqori' : 'past'}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Tezkor ma'lumotlar */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Bugungi natijalar" size="small">
            <div style={{ padding: '16px 0' }}>
              <Text type="secondary">
                Bu yerda bugungi chiqindi yig'ish natijalari, ishga chiqqan transport vositalari 
                va boshqa operatsion ma'lumotlar ko'rsatiladi.
              </Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Oxirgi faoliyat" size="small">
            <div style={{ padding: '16px 0' }}>
              <Text type="secondary">
                Bu yerda tizimda sodir bo'lgan oxirgi harakatlar, yangi kiritilgan ma'lumotlar 
                va o'zgarishlar ko'rsatiladi.
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
