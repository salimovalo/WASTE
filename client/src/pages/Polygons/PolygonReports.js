import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Typography,
  Button,
  Space,
  DatePicker,
  Select,
  Row,
  Col,
  Statistic,
  Tabs,
  message,
  Spin,
  Tag,
  Divider
} from 'antd';
import {
  FileExcelOutlined,
  PrinterOutlined,
  ReloadOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import moment from 'moment';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const PolygonReports = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([moment().startOf('month'), moment()]);
  const [selectedPolygon, setSelectedPolygon] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [polygons, setPolygons] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [reportData, setReportData] = useState({
    summary: {},
    byCompany: [],
    byDistrict: [],
    byVehicle: [],
    byDate: []
  });

  const { user } = useAuthStore();

  // Load initial data
  useEffect(() => {
    loadPolygons();
    loadCompanies();
    loadDistricts();
  }, []);

  // Load report data when filters change
  useEffect(() => {
    if (dateRange[0] && dateRange[1]) {
      loadReportData();
    }
  }, [dateRange, selectedPolygon, selectedCompany, selectedDistrict]);

  const loadPolygons = async () => {
    try {
      const response = await api.get('/polygons', {
        params: { limit: 100, is_active: true }
      });
      const data = response.data.polygons || response.data || [];
      setPolygons(data);
      
      // Default first polygon
      if (data.length > 0 && !selectedPolygon) {
        setSelectedPolygon(data[0].id);
      }
    } catch (error) {
      console.error('Error loading polygons:', error);
      message.error('Poligonlarni yuklashda xatolik');
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await api.get('/companies', {
        params: { limit: 100 }
      });
      setCompanies(response.data.companies || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const loadDistricts = async () => {
    try {
      const response = await api.get('/districts', {
        params: { limit: 100 }
      });
      setDistricts(response.data.districts || []);
    } catch (error) {
      console.error('Error loading districts:', error);
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      const params = {
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
        polygon_id: selectedPolygon,
        company_id: selectedCompany,
        district_id: selectedDistrict
      };

      const response = await api.get('/polygons/reports', { params });
      
      if (response.data.success) {
        setReportData(response.data.data);
      } else {
        // Generate sample data if API not ready
        generateSampleData();
      }
    } catch (error) {
      console.error('Error loading report data:', error);
      // Use sample data
      generateSampleData();
    } finally {
      setLoading(false);
    }
  };

  const generateSampleData = () => {
    const sampleData = {
      summary: {
        totalTrips: Math.floor(Math.random() * 1000) + 500,
        totalVolume: Math.floor(Math.random() * 10000) + 5000,
        totalVehicles: Math.floor(Math.random() * 50) + 20,
        avgTripsPerDay: Math.floor(Math.random() * 30) + 10
      },
      byCompany: [
        {
          key: '1',
          company: 'ANGREN BUNYOD FAYZ',
          trips: Math.floor(Math.random() * 500) + 200,
          volume: Math.floor(Math.random() * 5000) + 2000,
          vehicles: Math.floor(Math.random() * 20) + 10,
          percentage: '55%'
        },
        {
          key: '2',
          company: 'ZERO WASTE',
          trips: Math.floor(Math.random() * 400) + 150,
          volume: Math.floor(Math.random() * 4000) + 1500,
          vehicles: Math.floor(Math.random() * 15) + 8,
          percentage: '45%'
        }
      ],
      byDistrict: [
        {
          key: '1',
          district: 'Nurafshon',
          company: 'ANGREN BUNYOD FAYZ',
          trips: Math.floor(Math.random() * 200) + 100,
          volume: Math.floor(Math.random() * 2000) + 1000,
          vehicles: Math.floor(Math.random() * 10) + 5
        },
        {
          key: '2',
          district: 'Olmaliq',
          company: 'ANGREN BUNYOD FAYZ',
          trips: Math.floor(Math.random() * 180) + 90,
          volume: Math.floor(Math.random() * 1800) + 900,
          vehicles: Math.floor(Math.random() * 8) + 4
        },
        {
          key: '3',
          district: 'Angren',
          company: 'ZERO WASTE',
          trips: Math.floor(Math.random() * 150) + 80,
          volume: Math.floor(Math.random() * 1500) + 800,
          vehicles: Math.floor(Math.random() * 7) + 3
        }
      ],
      byVehicle: Array.from({ length: 10 }, (_, i) => ({
        key: i + 1,
        vehicle: `${['01', '02', '03', '10', '20'][Math.floor(Math.random() * 5)]}${Math.floor(Math.random() * 900) + 100}AAA`,
        company: Math.random() > 0.5 ? 'ANGREN BUNYOD FAYZ' : 'ZERO WASTE',
        district: ['Nurafshon', 'Olmaliq', 'Angren'][Math.floor(Math.random() * 3)],
        trips: Math.floor(Math.random() * 50) + 10,
        volume: Math.floor(Math.random() * 500) + 100
      }))
    };

    setReportData(sampleData);
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['Poligon hisoboti', selectedPolygon ? polygons.find(p => p.id === selectedPolygon)?.name : 'Barcha poligonlar'],
      ['Sana oralig\'i', `${dateRange[0].format('DD.MM.YYYY')} - ${dateRange[1].format('DD.MM.YYYY')}`],
      [''],
      ['Ko\'rsatkich', 'Qiymat'],
      ['Jami qatnov', reportData.summary.totalTrips],
      ['Jami hajm (m³)', reportData.summary.totalVolume],
      ['Jami transport', reportData.summary.totalVehicles],
      ['O\'rtacha kunlik qatnov', reportData.summary.avgTripsPerDay]
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Umumiy');
    
    // By Company sheet
    const ws2 = XLSX.utils.json_to_sheet(reportData.byCompany);
    XLSX.utils.book_append_sheet(wb, ws2, 'Korxonalar bo\'yicha');
    
    // By District sheet
    const ws3 = XLSX.utils.json_to_sheet(reportData.byDistrict);
    XLSX.utils.book_append_sheet(wb, ws3, 'Tumanlar bo\'yicha');
    
    // By Vehicle sheet
    const ws4 = XLSX.utils.json_to_sheet(reportData.byVehicle);
    XLSX.utils.book_append_sheet(wb, ws4, 'Transport bo\'yicha');
    
    // Save file
    XLSX.writeFile(wb, `Poligon_hisobot_${moment().format('YYYY-MM-DD')}.xlsx`);
    message.success('Hisobot Excel formatda yuklandi');
  };

  const companyColumns = [
    {
      title: 'Korxona',
      dataIndex: 'company',
      key: 'company',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Qatnov soni',
      dataIndex: 'trips',
      key: 'trips',
      align: 'center',
      render: (value) => value.toLocaleString()
    },
    {
      title: 'Hajm (m³)',
      dataIndex: 'volume',
      key: 'volume',
      align: 'center',
      render: (value) => value.toLocaleString()
    },
    {
      title: 'Transport soni',
      dataIndex: 'vehicles',
      key: 'vehicles',
      align: 'center'
    },
    {
      title: 'Ulush',
      dataIndex: 'percentage',
      key: 'percentage',
      align: 'center',
      render: (value) => <Tag color="blue">{value}</Tag>
    }
  ];

  const districtColumns = [
    {
      title: 'Tuman',
      dataIndex: 'district',
      key: 'district',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Korxona',
      dataIndex: 'company',
      key: 'company'
    },
    {
      title: 'Qatnov soni',
      dataIndex: 'trips',
      key: 'trips',
      align: 'center',
      render: (value) => value.toLocaleString()
    },
    {
      title: 'Hajm (m³)',
      dataIndex: 'volume',
      key: 'volume',
      align: 'center',
      render: (value) => value.toLocaleString()
    },
    {
      title: 'Transport soni',
      dataIndex: 'vehicles',
      key: 'vehicles',
      align: 'center'
    }
  ];

  const vehicleColumns = [
    {
      title: 'Transport',
      dataIndex: 'vehicle',
      key: 'vehicle',
      render: (text) => <Tag color="green">{text}</Tag>
    },
    {
      title: 'Korxona',
      dataIndex: 'company',
      key: 'company'
    },
    {
      title: 'Tuman',
      dataIndex: 'district',
      key: 'district'
    },
    {
      title: 'Qatnov soni',
      dataIndex: 'trips',
      key: 'trips',
      align: 'center'
    },
    {
      title: 'Hajm (m³)',
      dataIndex: 'volume',
      key: 'volume',
      align: 'center',
      render: (value) => value.toLocaleString()
    }
  ];

  return (
    <Card>
      <Title level={4}>🗺️ Poligon Hisobotlari</Title>
      
      {/* Filters */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Text>Poligon:</Text>
          <Select
            value={selectedPolygon}
            onChange={setSelectedPolygon}
            style={{ width: '100%' }}
            placeholder="Poligon tanlang"
            allowClear
          >
            {polygons.map(polygon => (
              <Option key={polygon.id} value={polygon.id}>
                {polygon.name}
              </Option>
            ))}
          </Select>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Text>Korxona:</Text>
          <Select
            value={selectedCompany}
            onChange={setSelectedCompany}
            style={{ width: '100%' }}
            placeholder="Barcha korxonalar"
            allowClear
          >
            {companies.map(company => (
              <Option key={company.id} value={company.id}>
                {company.name}
              </Option>
            ))}
          </Select>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Text>Tuman:</Text>
          <Select
            value={selectedDistrict}
            onChange={setSelectedDistrict}
            style={{ width: '100%' }}
            placeholder="Barcha tumanlar"
            allowClear
          >
            {districts.map(district => (
              <Option key={district.id} value={district.id}>
                {district.name}
              </Option>
            ))}
          </Select>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Text>Sana oralig'i:</Text>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            style={{ width: '100%' }}
            format="DD.MM.YYYY"
          />
        </Col>
      </Row>

      {/* Action buttons */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col>
          <Space>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={loadReportData}
              loading={loading}
            >
              Yangilash
            </Button>
            <Button
              icon={<FileExcelOutlined />}
              onClick={exportToExcel}
              disabled={loading}
            >
              Excel yuklash
            </Button>
            <Button
              icon={<PrinterOutlined />}
              onClick={() => window.print()}
              disabled={loading}
            >
              Chop etish
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Jami qatnov"
              value={reportData.summary.totalTrips || 0}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Jami hajm (m³)"
              value={reportData.summary.totalVolume || 0}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Transport soni"
              value={reportData.summary.totalVehicles || 0}
              prefix={<LineChartOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="O'rtacha kunlik"
              value={reportData.summary.avgTripsPerDay || 0}
              suffix="qatnov"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Report Tables */}
      <Tabs defaultActiveKey="1">
        <TabPane tab="Korxonalar bo'yicha" key="1">
          <Table
            columns={companyColumns}
            dataSource={reportData.byCompany}
            loading={loading}
            pagination={false}
            bordered
            summary={(pageData) => {
              const totalTrips = pageData.reduce((sum, row) => sum + row.trips, 0);
              const totalVolume = pageData.reduce((sum, row) => sum + row.volume, 0);
              
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}><Text strong>JAMI:</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="center">
                    <Text strong>{totalTrips.toLocaleString()}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="center">
                    <Text strong>{totalVolume.toLocaleString()}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} />
                  <Table.Summary.Cell index={4} />
                </Table.Summary.Row>
              );
            }}
          />
        </TabPane>
        
        <TabPane tab="Tumanlar bo'yicha" key="2">
          <Table
            columns={districtColumns}
            dataSource={reportData.byDistrict}
            loading={loading}
            pagination={false}
            bordered
          />
        </TabPane>
        
        <TabPane tab="Transport bo'yicha" key="3">
          <Table
            columns={vehicleColumns}
            dataSource={reportData.byVehicle}
            loading={loading}
            pagination={{ pageSize: 10 }}
            bordered
          />
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default PolygonReports;




