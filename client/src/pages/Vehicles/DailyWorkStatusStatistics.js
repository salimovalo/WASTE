import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  DatePicker, 
  Table,
  Button,
  message,
  Space,
  Statistic,
  Progress,
  Tag,
  Spin,
  Select
} from 'antd';
import { 
  BarChartOutlined,
  CalendarOutlined,
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import moment from 'moment';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const DailyWorkStatusStatistics = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([
    moment().startOf('month'),
    moment()
  ]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [statistics, setStatistics] = useState({
    summary: {},
    reason_statistics: {},
    daily_data: []
  });
  const [districts, setDistricts] = useState([]);
  const [aggregatedData, setAggregatedData] = useState([]);

  const { user } = useAuthStore();

  // Statistikani olish
  const fetchStatistics = async (startDate = dateRange[0], endDate = dateRange[1]) => {
    setLoading(true);
    try {
      const params = {
        start_date: startDate.format('YYYY-MM-DD'),
        end_date: endDate.format('YYYY-MM-DD')
      };
      
      if (selectedDistrict) {
        params.district_id = selectedDistrict;
      }

      const response = await api.get('/daily-work-status/statistics', { params });
      setStatistics(response.data.data || {});
      
      // Texnika bo'yicha agregatlangan ma'lumotlarni yaratish
      aggregateDataByVehicle(response.data.data?.daily_data || []);
      
    } catch (error) {
      console.error('Error fetching statistics:', error);
      message.error('Statistikani olishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  // Tumanlar ro'yxatini olish
  const fetchDistricts = async () => {
    try {
      const response = await api.get('/districts');
      setDistricts(response.data.districts || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  // Texnika bo'yicha ma'lumotlarni agregatlashtirish
  const aggregateDataByVehicle = (dailyData) => {
    const vehicleMap = {};
    
    dailyData.forEach(record => {
      const vehicleId = record.vehicle.id;
      const plateNumber = record.vehicle.plate_number;
      
      if (!vehicleMap[vehicleId]) {
        vehicleMap[vehicleId] = {
          vehicle: record.vehicle,
          total_days: 0,
          working_days: 0,
          not_working_days: 0,
          working_percentage: 0,
          reasons: {}
        };
      }
      
      vehicleMap[vehicleId].total_days += 1;
      
      if (record.work_status === 'working') {
        vehicleMap[vehicleId].working_days += 1;
      } else {
        vehicleMap[vehicleId].not_working_days += 1;
        
        // Sabablarni hisobga olish
        if (record.reason) {
          const reasonName = record.reason.name;
          vehicleMap[vehicleId].reasons[reasonName] = 
            (vehicleMap[vehicleId].reasons[reasonName] || 0) + 1;
        }
      }
      
      // Foizni hisoblash
      vehicleMap[vehicleId].working_percentage = Math.round(
        (vehicleMap[vehicleId].working_days / vehicleMap[vehicleId].total_days) * 100
      );
    });
    
    const aggregated = Object.values(vehicleMap).sort(
      (a, b) => a.vehicle.plate_number.localeCompare(b.vehicle.plate_number)
    );
    
    setAggregatedData(aggregated);
  };

  useEffect(() => {
    fetchStatistics();
    fetchDistricts();
  }, [dateRange, selectedDistrict]);

  // Excel export qilish
  const handleExportExcel = () => {
    // Bu yerda Excel export funksiyasi bo'ladi
    message.info('Excel export funksiyasi tez orada qo\'shiladi');
  };

  // Texnikalar statistikasi jadvali ustunlari
  const vehicleColumns = [
    {
      title: 'Texnika',
      key: 'vehicle',
      width: 200,
      render: (record) => (
        <Space>
          <CarOutlined />
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {record.vehicle.plate_number}
            </div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              {record.vehicle.brand} {record.vehicle.model}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: 'Tuman',
      key: 'district',
      width: 120,
      render: (record) => record.vehicle.district?.name || '-'
    },
    {
      title: 'Jami kunlar',
      dataIndex: 'total_days',
      key: 'total_days',
      width: 100,
      align: 'center'
    },
    {
      title: 'Ishlagan kunlar',
      dataIndex: 'working_days',
      key: 'working_days',
      width: 120,
      align: 'center',
      render: (days) => (
        <Tag color="green" icon={<CheckCircleOutlined />}>
          {days}
        </Tag>
      )
    },
    {
      title: 'Ishlamagan kunlar',
      dataIndex: 'not_working_days',
      key: 'not_working_days',
      width: 130,
      align: 'center',
      render: (days) => (
        <Tag color="red" icon={<CloseCircleOutlined />}>
          {days}
        </Tag>
      )
    },
    {
      title: 'Ishlash foizi',
      key: 'working_percentage',
      width: 150,
      render: (record) => (
        <Progress
          percent={record.working_percentage}
          size="small"
          status={
            record.working_percentage >= 85 ? 'success' :
            record.working_percentage >= 75 ? 'normal' : 'exception'
          }
        />
      )
    },
    {
      title: 'Asosiy sabablar',
      key: 'reasons',
      render: (record) => {
        const reasons = Object.entries(record.reasons)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 2);
        
        if (reasons.length === 0) {
          return <Tag color="green">Sabablar yo'q</Tag>;
        }
        
        return (
          <div>
            {reasons.map(([reason, count]) => (
              <Tag key={reason} color="orange" style={{ marginBottom: 2 }}>
                {reason} ({count})
              </Tag>
            ))}
          </div>
        );
      }
    }
  ];

  // Sabablar statistikasi
  const reasonsData = Object.entries(statistics.reason_statistics || {})
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  const reasonsColumns = [
    {
      title: 'Sabab',
      dataIndex: 'reason',
      key: 'reason'
    },
    {
      title: 'Soni',
      dataIndex: 'count',
      key: 'count',
      align: 'center',
      render: (count) => <Tag color="red">{count}</Tag>
    }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <div>
              <Title level={3} style={{ margin: 0 }}>
                <BarChartOutlined /> Statistika
              </Title>
              {user && (
                <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                  {user.role?.name === 'operator' && (
                    <span>Tuman: {user.district_access?.map(d => d.name).join(', ') || 'N/A'}</span>
                  )}
                  {user.role?.name === 'company_admin' && user.company && (
                    <span>Korxona: {user.company.name}</span>
                  )}
                  {user.role?.name === 'super_admin' && (
                    <span>Barcha korxonalar</span>
                  )}
                </div>
              )}
            </div>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<FileExcelOutlined />}
                onClick={handleExportExcel}
              >
                Excel
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Filtrlar */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Space>
              <CalendarOutlined />
              <span>Muddat:</span>
            </Space>
          </Col>
          <Col>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              defaultValue={[moment().startOf('month'), moment()]}
              format="DD.MM.YYYY"
              style={{ width: 250 }}
              size="middle"
              allowClear={false}
              disabledDate={(current) => current && current > moment().endOf('day')}
              getPopupContainer={trigger => trigger.parentElement}
            />
          </Col>
          {['super_admin', 'company_admin'].includes(user?.role?.name) && (
            <>
              <Col>
                <span>Tuman:</span>
              </Col>
              <Col>
                <Select
                  style={{ width: 200 }}
                  placeholder="Barcha tumanlar"
                  allowClear
                  value={selectedDistrict}
                  onChange={setSelectedDistrict}
                >
                  {districts.map(district => (
                    <Option key={district.id} value={district.id}>
                      {district.name}
                    </Option>
                  ))}
                </Select>
              </Col>
            </>
          )}
        </Row>
      </Card>

      {/* Umumiy statistika */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Jami yozuvlar"
              value={statistics.summary?.total_records || 0}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Ishlaganlar"
              value={statistics.summary?.working_count || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Ishlamaganlar"
              value={statistics.summary?.not_working_count || 0}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tasdiqlangan"
              value={statistics.summary?.confirmed_count || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Texnikalar bo'yicha statistika */}
      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="Texnikalar bo'yicha statistika" style={{ marginBottom: 24 }}>
            <Spin spinning={loading}>
              <Table
                columns={vehicleColumns}
                dataSource={aggregatedData}
                rowKey={(record) => record.vehicle.id}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total, range) => 
                    `${range[0]}-${range[1]} / ${total} ta`
                }}
                scroll={{ x: 'max-content' }}
              />
            </Spin>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Sabablar bo'yicha statistika" style={{ marginBottom: 24 }}>
            <Table
              columns={reasonsColumns}
              dataSource={reasonsData}
              rowKey="reason"
              pagination={false}
              size="small"
              scroll={{ y: 400 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Kunlik batafsil ma'lumotlar */}
      {statistics.daily_data && statistics.daily_data.length > 0 && (
        <Card title="Batafsil kunlik ma'lumotlar">
          <Table
            columns={[
              {
                title: 'Sana',
                dataIndex: 'date',
                key: 'date',
                render: (date) => moment(date).format('DD.MM.YYYY')
              },
              {
                title: 'Texnika',
                key: 'vehicle',
                render: (record) => `${record.vehicle.plate_number} (${record.vehicle.brand})`
              },
              {
                title: 'Holat',
                dataIndex: 'work_status',
                key: 'work_status',
                render: (status) => (
                  <Tag color={status === 'working' ? 'green' : 'red'}>
                    {status === 'working' ? 'Ishga chiqdi' : 'Ishga chiqmadi'}
                  </Tag>
                )
              },
              {
                title: 'Sabab',
                key: 'reason',
                render: (record) => record.reason?.name || '-'
              },
              {
                title: 'Operator',
                key: 'operator',
                render: (record) => record.operator?.full_name || '-'
              }
            ]}
            dataSource={statistics.daily_data}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true
            }}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      )}
    </div>
  );
};

export default DailyWorkStatusStatistics;
