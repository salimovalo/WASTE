import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Row, 
  Col, 
  Progress,
  message,
  Spin,
  Button,
  Dropdown,
  Grid,
  Card,
  Statistic
} from 'antd';
import { 
  DownloadOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CarOutlined
} from '@ant-design/icons';
import { saveAs } from 'file-saver';
import api from '../../services/api';
import { useSelectedCompany } from '../../components/Layout/CompanySelector';
import useDateStore from '../../stores/dateStore';
import moment from 'moment';
import './DailyWorkStatusSummary.css';

const { Title } = Typography;
const { useBreakpoint } = Grid;

const DailyWorkStatusSummary = () => {
  const [loading, setLoading] = useState(false);
  const [districtSummary, setDistrictSummary] = useState([]);
  const [totalSummary, setTotalSummary] = useState({
    total_vehicles: 0,
    working: 0,
    not_working: 0,
    working_percentage: 0
  });

  const { selectedCompany } = useSelectedCompany();
  const { selectedDate, getApiDate } = useDateStore();

  // Responsive breakpoints - kattalashtirildigan o'lchamlar
  const screens = useBreakpoint();
  const headerFontSize = screens.xl ? 28 : screens.lg ? 26 : screens.md ? 24 : 22;
  const containerPadding = screens.xl ? 40 : screens.lg ? 32 : screens.md ? 28 : 24;
  const progressSize = screens.xl ? 280 : screens.lg ? 250 : screens.md ? 220 : 180;
  const sectionMinHeight = screens.md ? 500 : 450;
  const listMaxHeight = screens.lg ? 480 : screens.md ? 440 : 380;

  // Tumanlar bo'yicha xulosani olish
  const fetchDistrictSummary = async () => {
    setLoading(true);
    try {
      const params = {
        date: getApiDate(),
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
  }, [selectedCompany]); // eslint-disable-line react-hooks/exhaustive-deps

  // Global sana o'zgarganda ma'lumotlarni yuklash
  useEffect(() => {
    const handleDateChange = () => {
      fetchDistrictSummary();
    };
    
    window.addEventListener('dateChanged', handleDateChange);
    return () => window.removeEventListener('dateChanged', handleDateChange);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Export funksiyalari
  const exportToImage = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = document.querySelector('.excel-style-dashboard');
      if (!element) return;

      // Web fontlar yuklanishini kutish (agar mavjud bo'lsa)
      if (document.fonts && document.fonts.ready) {
        try { await document.fonts.ready; } catch (_) {}
      }

      // Element o'lchamlarini aniq hisoblash
      const rect = element.getBoundingClientRect();
      const width = Math.max(element.scrollWidth, Math.ceil(rect.width));
      const height = Math.max(element.scrollHeight, Math.ceil(rect.height));

      const scale = Math.min(3, (window.devicePixelRatio || 1) * 1.5);

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale,
        width,
        height,
        windowWidth: width,
        windowHeight: height,
        removeContainer: true,
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
      if (!blob) throw new Error('Canvas blob hosil bo\'lmadi');
      saveAs(blob, `transport-hisobot-${selectedDate.format('DD-MM-YYYY')}.jpg`);
      message.success('JPG fayli muvaffaqiyatli yuklandi');
    } catch (error) {
      message.error('JPG export xatoligi: ' + error.message);
    }
  };

  const exportToPDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const element = document.querySelector('.excel-style-dashboard');
      if (!element) return;
      
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 3,
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`transport-hisobot-${selectedDate.format('DD-MM-YYYY')}.pdf`);
      
      message.success('PDF fayli muvaffaqiyatli yuklandi');
    } catch (error) {
      message.error('PDF export xatoligi: ' + error.message);
    }
  };

  const exportMenuItems = [
    {
      key: 'jpg',
      label: <span><FileImageOutlined /> JPG formatida</span>,
      onClick: exportToImage
    },
    {
      key: 'pdf', 
      label: <span><FilePdfOutlined /> PDF formatida</span>,
      onClick: exportToPDF
    }
  ];

  return (
    <div className="daily-work-status-summary excel-style-dashboard">
      
      {/* Rasmiy hujjat header - jiddiy dizayn */}
      <div style={{
        background: '#ffffff',
        padding: `${containerPadding + 8}px ${containerPadding + 16}px`,
        marginBottom: '32px',
        border: '3px solid #374151',
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Title level={2} style={{
            margin: 0,
            fontSize: `${Math.max(20, headerFontSize - 4)}px`,
            fontWeight: '700',
            color: '#111827',
            fontFamily: "'Times New Roman', serif",
            letterSpacing: '1px',
            lineHeight: '1.4',
            textTransform: 'uppercase',
            border: '1px solid #d1d5db',
            padding: '16px',
            background: '#f9fafb'
          }}>
            "{selectedCompany?.name || 'ZERO WASTE'}" MCHJ NING HUDUDIY FILIALLARI<br/>
            TASARRUFIDAGI MAISHIY CHIQINDI TASHUVCHI TEXNIKALARNING<br/>
            HOLATI BO'YICHA TAHLILIY MA'LUMOT<br/>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#374151',
              display: 'block',
              marginTop: '12px',
              padding: '8px',
              background: '#ffffff',
              border: '1px solid #e5e7eb'
            }}>
              SANA: {selectedDate && moment.isMoment(selectedDate) ? selectedDate.format('DD.MM.YYYY') : moment().format('DD.MM.YYYY')}
            </span>
            </Title>
            </div>
        
        <Row justify="end" align="middle" style={{ marginTop: '16px' }}>
          <Col>
            <Dropdown menu={{ items: exportMenuItems }}>
              <Button type="primary" icon={<DownloadOutlined />}>
                Export
              </Button>
            </Dropdown>
          </Col>
        </Row>
      </div>

      <Spin spinning={loading}>
        
        {/* Umumiy statistika kartlari - jiddiy dizayn */}
        <Row gutter={[20, 20]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card 
              style={{ 
                background: '#ffffff',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <Statistic
                title={
                  <span style={{ 
                    color: '#374151', 
                    fontSize: '13px', 
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Jami texnikalar
                  </span>
                }
                value={totalSummary.total_vehicles}
                prefix={<CarOutlined style={{ color: '#6b7280', fontSize: '20px' }} />}
                valueStyle={{ 
                  color: '#111827', 
                  fontSize: '28px', 
                  fontWeight: '700',
                  fontFamily: "'Times New Roman', serif"
                }}
                suffix="ta"
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card 
              style={{ 
                background: '#ffffff',
                border: '2px solid #10b981',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
              }}
            >
              <Statistic
                title={
                  <span style={{ 
                    color: '#065f46', 
                    fontSize: '13px', 
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Yo'nalishga chiqqan
                  </span>
                }
                value={totalSummary.working}
                prefix={<CheckCircleOutlined style={{ color: '#10b981', fontSize: '20px' }} />}
                valueStyle={{ 
                  color: '#065f46', 
                  fontSize: '28px', 
                  fontWeight: '700',
                  fontFamily: "'Times New Roman', serif"
                }}
                suffix="ta"
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card 
              style={{ 
                background: '#ffffff',
                border: '2px solid #ef4444',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)'
              }}
            >
              <Statistic
                title={
                  <span style={{ 
                    color: '#991b1b', 
                    fontSize: '13px', 
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Yo'nalishga chiqmagan
                  </span>
                }
                value={totalSummary.not_working}
                prefix={<CloseCircleOutlined style={{ color: '#ef4444', fontSize: '20px' }} />}
                valueStyle={{ 
                  color: '#991b1b', 
                  fontSize: '28px', 
                  fontWeight: '700',
                  fontFamily: "'Times New Roman', serif"
                }}
                suffix="ta"
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card 
              style={{ 
                background: '#ffffff',
                border: '2px solid #f59e0b',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)'
              }}
            >
              <Statistic
                title={
                  <span style={{ 
                    color: '#92400e', 
                    fontSize: '13px', 
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Ishlash foizi
                  </span>
                }
                value={totalSummary.working_percentage}
                valueStyle={{ 
                  color: '#92400e', 
                  fontSize: '28px', 
                  fontWeight: '700',
                  fontFamily: "'Times New Roman', serif"
                }}
                suffix="%"
              />
            </Card>
          </Col>
        </Row>

        {/* Tumanlar bo'yicha batafsil ma'lumot - jiddiy dizayn */}
        <div style={{
          background: '#ffffff',
          padding: `${containerPadding}px`,
          borderRadius: '8px',
          border: '2px solid #d1d5db',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          
          <Title level={3} style={{ 
            marginBottom: '24px', 
            color: '#111827',
            fontSize: '20px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            borderBottom: '2px solid #e5e7eb',
            paddingBottom: '12px',
            fontFamily: "'Times New Roman', serif"
          }}>
            Tumanlar bo'yicha batafsil ma'lumot
          </Title>
          
          <Row gutter={[16, 16]}>
            {districtSummary.map((district, index) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={index}>
                <Card
                  style={{
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                  }}
                  bodyStyle={{ padding: '16px' }}
                  hoverable={true}
                >
                  {/* Tuman nomi - jiddiy header */}
                  <div style={{
                    background: '#f9fafb',
                    color: '#111827',
                    textAlign: 'center',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    marginBottom: '16px',
                    fontSize: '13px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    fontFamily: "'Arial', sans-serif"
                  }}>
                    {district.district_name || 'NOMA\'LUM TUMAN'}
                  </div>

                  {/* Jadval ko'rinishidagi statistika */}
                  <div style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    marginBottom: '12px'
                  }}>
                    {/* Header */}
                    <div style={{
                      background: '#f3f4f6',
                      padding: '8px',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      <Row>
                        <Col span={8} style={{ 
                          textAlign: 'center', 
                          fontSize: '11px', 
                          fontWeight: '700',
                          color: '#374151',
                          textTransform: 'uppercase'
                        }}>
                          Chiqqan
                        </Col>
                        <Col span={8} style={{ 
                          textAlign: 'center', 
                          fontSize: '11px', 
                          fontWeight: '700',
                          color: '#374151',
                          textTransform: 'uppercase',
                          borderLeft: '1px solid #d1d5db',
                          borderRight: '1px solid #d1d5db'
                        }}>
                          Chiqmagan
                        </Col>
                        <Col span={8} style={{ 
                          textAlign: 'center', 
                          fontSize: '11px', 
                          fontWeight: '700',
                          color: '#374151',
                          textTransform: 'uppercase'
                        }}>
                          Foiz
                        </Col>
                      </Row>
                    </div>
                    {/* Values */}
                    <div style={{ padding: '12px 8px' }}>
                      <Row>
                        <Col span={8} style={{ textAlign: 'center' }}>
                          <div style={{ 
                            fontSize: '18px', 
                            fontWeight: '700', 
                            color: '#059669',
                            fontFamily: "'Times New Roman', serif"
                          }}>
                            {district.working || 0}
                          </div>
                        </Col>
                        <Col span={8} style={{ 
                          textAlign: 'center',
                          borderLeft: '1px solid #e5e7eb',
                          borderRight: '1px solid #e5e7eb'
                        }}>
                          <div style={{ 
                            fontSize: '18px', 
                            fontWeight: '700', 
                            color: '#dc2626',
                            fontFamily: "'Times New Roman', serif"
                          }}>
                            {district.not_working || 0}
                          </div>
                        </Col>
                        <Col span={8} style={{ textAlign: 'center' }}>
                          <div style={{ 
                            fontSize: '18px', 
                            fontWeight: '700', 
                            color: '#d97706',
                            fontFamily: "'Times New Roman', serif"
                          }}>
                            {district.working_percentage || 0}%
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </div>

                  {/* Oddiy progress bar */}
                  <div style={{
                    background: '#f3f4f6',
                    height: '8px',
                    borderRadius: '4px',
                    marginBottom: '12px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${district.working_percentage || 0}%`,
                      background: district.working_percentage >= 80 ? '#059669' : 
                                 district.working_percentage >= 50 ? '#d97706' : '#dc2626',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>

                  {/* Texnikalar soni - jiddiy ko'rinish */}
                  <div style={{
                    background: '#f9fafb',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: '#374151',
                    fontWeight: '600',
                    fontFamily: "'Arial', sans-serif"
                  }}>
                    JAMI: {district.total_vehicles || 0} TA TEXNIKA
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* Yo'nalishga chiqmaslik sabablari - jiddiy jadval ko'rinishi */}
        {districtSummary.some(district => district.not_working > 0 && district.not_working_vehicles) && (
          <div style={{
            background: '#ffffff',
            padding: `${containerPadding}px`,
            borderRadius: '8px',
            border: '2px solid #d1d5db',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            marginTop: '32px'
          }}>
            
            <Title level={3} style={{ 
              marginBottom: '24px', 
              color: '#111827',
              fontSize: '20px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '12px',
              fontFamily: "'Times New Roman', serif"
            }}>
              Yo'nalishga chiqmaslik sabablari
            </Title>
            
            <Row gutter={[16, 16]}>
              {districtSummary
                .filter(district => district.not_working > 0 && district.not_working_vehicles)
                .map((district, index) => (
                <Col xs={24} lg={12} xl={8} key={index}>
                  <div style={{
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#ffffff'
                  }}>
                    {/* Header - jiddiy ko'rinish */}
                    <div style={{
                      background: '#f9fafb',
                      color: '#111827',
                      padding: '12px 16px',
                      borderBottom: '1px solid #d1d5db',
                      fontSize: '14px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      textAlign: 'center',
                      fontFamily: "'Arial', sans-serif"
                    }}>
                      {district.district_name || 'NOMA\'LUM TUMAN'}
                    </div>
                    
                    {/* Content - business table style */}
                    <div style={{ padding: '16px', maxHeight: '250px', overflowY: 'auto' }}>
                      {district.not_working_vehicles.slice(0, 12).map((vehicle, vIndex) => (
                        <div key={vIndex} style={{
                          padding: '10px 12px',
                          background: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          marginBottom: '8px',
                          fontSize: '13px',
                          fontFamily: "'Arial', sans-serif"
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '4px'
                          }}>
                            <span style={{ 
                              fontWeight: '700', 
                              color: '#111827',
                              fontSize: '14px'
                            }}>
                              {vehicle.plate_number}
                            </span>
                            <span style={{ 
                              fontSize: '11px', 
                              color: '#6b7280',
                              fontWeight: '600',
                              background: '#f3f4f6',
                              padding: '2px 6px',
                              borderRadius: '2px'
                            }}>
                              {vehicle.vehicle_type === 'garbage_truck' ? 'BBA' : 
                               vehicle.vehicle_type === 'container_truck' ? 'LCA' : 
                               vehicle.vehicle_type === 'compactor_truck' ? 'BCA' : 'VAA'}
                            </span>
                          </div>
                          {vehicle.reason && (
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#6b7280',
                              fontStyle: 'normal',
                              borderTop: '1px solid #f3f4f6',
                              paddingTop: '4px'
                            }}>
                              <strong>Sabab:</strong> {vehicle.reason}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}
        
      </Spin>
    </div>
  );
};

export default DailyWorkStatusSummary;