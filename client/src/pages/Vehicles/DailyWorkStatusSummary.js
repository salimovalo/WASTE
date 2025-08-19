import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  DatePicker,
  Statistic,
  Progress,
  message,
  Spin,
  Divider,
  Tag
} from 'antd';
import { 
  CalendarOutlined, 
  CarOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import moment from 'moment';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useSelectedCompany } from '../../components/Layout/CompanySelector';
import './DailyWorkStatusSummary.css';

const { Title } = Typography;

const DailyWorkStatusSummary = () => {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [districtSummary, setDistrictSummary] = useState([]);
  const [totalSummary, setTotalSummary] = useState({
    total_vehicles: 0,
    working: 0,
    not_working: 0,
    working_percentage: 0
  });

  const { user } = useAuthStore();
  const { selectedCompany } = useSelectedCompany();

  // Tumanlar bo'yicha xulosani olish
  const fetchDistrictSummary = async (date = selectedDate) => {
    setLoading(true);
    try {
      const params = {
        date: date.format('YYYY-MM-DD'),
        summary_by_district: true
      };
      
      if (selectedCompany?.id) {
        params.company_id = selectedCompany.id;
      }

      const response = await api.get('/daily-work-status/district-summary', { params });
      
      const summary = response.data.data || [];
      setDistrictSummary(summary);
      
      // Umumiy xulosani hisoblash
      const totalVehicles = summary.reduce((sum, district) => sum + (district.total_vehicles || 0), 0);
      const totalWorking = summary.reduce((sum, district) => sum + (district.working || 0), 0);
      const totalNotWorking = summary.reduce((sum, district) => sum + (district.not_working || 0), 0);
      
      setTotalSummary({
        total_vehicles: totalVehicles,
        working: totalWorking,
        not_working: totalNotWorking,
        working_percentage: totalVehicles > 0 ? Math.round((totalWorking / totalVehicles) * 100) : 0
      });
      
    } catch (error) {
      console.error('Error fetching district summary:', error);
      message.error('Tumanlar bo\'yicha ma\'lumot olishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistrictSummary();
  }, [selectedDate, selectedCompany]);

  // Rang tanlovchi
  const getPercentageColor = (percentage) => {
    if (percentage >= 90) return '#52c41a';  // Yashil
    if (percentage >= 80) return '#faad14';  // Sariq
    if (percentage >= 70) return '#fa8c16';  // To'q sariq
    return '#ff4d4f';  // Qizil
  };

  const getPercentageStatus = (percentage) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 80) return 'normal';
    if (percentage >= 70) return 'active';
    return 'exception';
  };

  return (
    <div className="daily-work-status-summary">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <CalendarOutlined /> Texnikalar Holati Bo'yicha Tahliliy Ma'lumot
            </Title>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
              Tumanlar kesimida kunlik ishga chiqish ko'rsatkichlari
            </div>
          </Col>
          <Col>
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              defaultValue={moment()}
              format="DD.MM.YYYY"
              placeholder="Sanani tanlang"
              style={{ width: 180 }}
              size="middle"
              allowClear={false}
              disabledDate={(current) => current && current > moment().endOf('day')}
              getPopupContainer={trigger => trigger.parentElement}
            />
          </Col>
        </Row>
      </div>

      <Spin spinning={loading}>
        {/* Umumiy ko'rsatkichlar */}
        <Card 
          className="summary-card" 
          style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <Row gutter={24} align="middle">
            <Col xs={24} md={12}>
              <div style={{ color: 'white' }}>
                <Title level={2} style={{ color: 'white', margin: 0 }}>
                  UMUMIY KO'RSATKICHLAR
                </Title>
                {selectedCompany && (
                  <div style={{ fontSize: '28px', marginTop: '8px', opacity: 0.95, fontWeight: 'bold' }}>
                    {selectedCompany.name}
                  </div>
                )}
                <div style={{ fontSize: '20px', marginTop: '8px', opacity: 0.9 }}>
                  {selectedDate.format('DD.MM.YYYY')} sanasi uchun
                </div>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ textAlign: 'center', color: 'white' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                      {totalSummary.total_vehicles}
                    </div>
                    <div style={{ opacity: 0.9 }}>JAMI TEXNIKALAR</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center', color: 'white' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#52c41a' }}>
                      {totalSummary.working}
                    </div>
                    <div style={{ opacity: 0.9 }}>ISHLAGANLAR</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center', color: 'white' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff7875' }}>
                      {totalSummary.not_working}
                    </div>
                    <div style={{ opacity: 0.9 }}>ISHLAMAGANLAR</div>
                  </div>
                </Col>
              </Row>
              <Divider style={{ borderColor: 'rgba(255,255,255,0.3)', margin: '16px 0' }} />
              <div style={{ textAlign: 'center', color: 'white' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {totalSummary.working_percentage}%
                </div>
                <div style={{ opacity: 0.9 }}>UMUMIY ISHLASH FOIZI</div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Tumanlar bo'yicha batafsil */}
        <Card title={
          <span>
            <EnvironmentOutlined /> TUMANLAR BO'YICHA BATAFSIL MA'LUMOT
          </span>
        }>
          {districtSummary.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              Tanlangan sana uchun ma'lumot topilmadi
            </div>
          ) : (
            <Row gutter={[16, 16]}>
              {districtSummary.map((district, index) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={district.district_id || index}>
                  <Card 
                    className="district-card"
                    hoverable
                    style={{
                      borderLeft: `4px solid ${getPercentageColor(district.working_percentage)}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <Title level={4} style={{ margin: '0 0 16px 0', color: '#2f3349' }}>
                        {district.district_name || 'Noma\'lum tuman'}
                      </Title>
                      
                      {/* Progress donut */}
                      <div style={{ marginBottom: '16px' }}>
                        <Progress
                          type="circle"
                          percent={district.working_percentage || 0}
                          width={100}
                          strokeColor={getPercentageColor(district.working_percentage)}
                          status={getPercentageStatus(district.working_percentage)}
                          format={() => `${district.working_percentage || 0}%`}
                        />
                      </div>

                      {/* Statistikalar */}
                      <Row gutter={8}>
                        <Col span={24}>
                          <Statistic
                            title="Jami texnikalar"
                            value={district.total_vehicles || 0}
                            prefix={<CarOutlined />}
                            valueStyle={{ fontSize: '18px', color: '#2f3349' }}
                          />
                        </Col>
                      </Row>
                      
                      <Divider style={{ margin: '12px 0' }} />
                      
                      <Row gutter={8}>
                        <Col span={12}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ 
                              fontSize: '20px', 
                              fontWeight: 'bold', 
                              color: '#52c41a' 
                            }}>
                              {district.working || 0}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              <CheckCircleOutlined /> Ishlaganlar
                            </div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ 
                              fontSize: '20px', 
                              fontWeight: 'bold', 
                              color: '#ff4d4f' 
                            }}>
                              {district.not_working || 0}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              <CloseCircleOutlined /> Ishlamaganlar
                            </div>
                          </div>
                        </Col>
                      </Row>

                      {/* Holat belgisi */}
                      <div style={{ marginTop: '12px' }}>
                        <Tag 
                          color={getPercentageColor(district.working_percentage)}
                          style={{ 
                            borderRadius: '12px', 
                            padding: '4px 12px',
                            fontWeight: 'bold'
                          }}
                        >
                          {district.working_percentage >= 90 ? 'A\'LO' :
                           district.working_percentage >= 80 ? 'YAXSHI' :
                           district.working_percentage >= 70 ? 'O\'RTACHA' : 'YOMON'}
                        </Tag>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card>
      </Spin>
    </div>
  );
};

export default DailyWorkStatusSummary;
