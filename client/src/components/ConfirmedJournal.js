import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  Table,
  Button,
  message,
  Space,
  DatePicker,
  Select,
  Input,
  Tag,
  Tooltip,
  Spin
} from 'antd';
import { 
  FileExcelOutlined,
  SearchOutlined,
  FilterOutlined,
  CalendarOutlined,
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import moment from 'moment';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import api from '../services/api';
import useDateStore from '../stores/dateStore';
import { useAuthStore } from '../stores/authStore';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ConfirmedJournal = () => {
  const [loading, setLoading] = useState(false);
  const [journalData, setJournalData] = useState([]);
  const [pivotData, setPivotData] = useState({});
  const [totalEntries, setTotalEntries] = useState(0);
  const [districts, setDistricts] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [filters, setFilters] = useState({
    start_date: moment().startOf('month').format('YYYY-MM-DD'),
    end_date: moment().format('YYYY-MM-DD'),
    district_id: null,
    work_status: null,
    vehicle_id: null
  });

  const { user } = useAuthStore();
  const { selectedDate } = useDateStore();

  useEffect(() => {
    fetchJournalData();
    fetchDistricts();
    fetchVehicles();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedDate && moment.isMoment(selectedDate)) {
      const newFilters = {
        ...filters,
        start_date: moment(selectedDate).startOf('month').format('YYYY-MM-DD'),
        end_date: moment(selectedDate).format('YYYY-MM-DD')
      };
      setFilters(newFilters);
      fetchJournalData(newFilters);
    }
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchJournalData = async (customFilters = null) => {
    setLoading(true);
    try {
      const params = customFilters || filters;
      const response = await api.get('/daily-work-status/confirmed-journal', { params });
      
      setJournalData(response.data.data.journal);
      setPivotData(response.data.data.pivot_data);
      setTotalEntries(response.data.data.total_entries);
    } catch (error) {
      console.error('Error fetching journal data:', error);
      message.error('Jurnal ma\'lumotlarini olishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async () => {
    try {
      const response = await api.get('/districts');
      setDistricts(response.data.districts || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/technics');
      setVehicles(response.data.vehicles || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchJournalData(newFilters);
  };

  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      const newFilters = {
        ...filters,
        start_date: dates[0].format('YYYY-MM-DD'),
        end_date: dates[1].format('YYYY-MM-DD')
      };
      setFilters(newFilters);
      fetchJournalData(newFilters);
    }
  };

  const exportToExcel = () => {
    try {
      // Jurnal ma'lumotlarini Excel uchun tayyorlash
      const journalExportData = journalData.map(item => ({
        'Sana': moment(item.date).format('DD.MM.YYYY'),
        'Texnika': item.vehicle.plate_number,
        'Marka': `${item.vehicle.brand} ${item.vehicle.model}`,
        'Tuman': item.vehicle.district?.name || '',
        'Korxona': item.vehicle.company?.name || '',
        'Holat': item.work_status === 'working' ? 'Ishga chiqdi' : 'Ishga chiqmadi',
        'Sabab': item.reason?.name || '',
        'Sabab tafsiloti': item.reason_details || '',
        'Ishni boshlash vaqti': item.start_time || '',
        'Ishni tugatish vaqti': item.end_time || '',
        'Izohlar': item.notes || '',
        'Operator': item.operator ? `${item.operator.first_name} ${item.operator.last_name}` : '',
        'Tasdiqlagan': item.confirmer ? `${item.confirmer.first_name} ${item.confirmer.last_name}` : '',
        'Tasdiqlangan sana': moment(item.confirmed_at).format('DD.MM.YYYY HH:mm'),
        'Yaratilgan sana': moment(item.created_at).format('DD.MM.YYYY HH:mm')
      }));

      // Yeg'indi jadvalini tayyorlash
      const pivotExportData = Object.entries(pivotData).map(([district, data]) => ({
        'Tuman': district,
        'Jami yozuvlar': data.total,
        'Ishlagan': data.working,
        'Ishlamagan': data.not_working,
        'Texnikalar soni': data.vehicles_count,
        'Ishlash foizi': data.total > 0 ? Math.round((data.working / data.total) * 100) + '%' : '0%',
        'Asosiy sabablar': Object.entries(data.reasons || {})
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([reason, count]) => `${reason} (${count})`)
          .join(', ')
      }));

      // Excel workbook yaratish
      const wb = XLSX.utils.book_new();

      // Jurnal sahifasini qo'shish
      const journalWs = XLSX.utils.json_to_sheet(journalExportData);
      XLSX.utils.book_append_sheet(wb, journalWs, 'Jurnal');

      // Yeg\'indi sahifasini qo\'shish
      const pivotWs = XLSX.utils.json_to_sheet(pivotExportData);
      XLSX.utils.book_append_sheet(wb, pivotWs, 'Yeg\'indi');

      // Fayl nomini yaratish
      const fileName = `Tasdiqlangan_Yozuvlar_${moment(filters.start_date).format('DD-MM-YYYY')}_${moment(filters.end_date).format('DD-MM-YYYY')}.xlsx`;

      // Faylni saqlash
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, fileName);

      message.success('Excel fayli muvaffaqiyatli eksport qilindi');
    } catch (error) {
      console.error('Excel export error:', error);
      message.error('Excel eksport qilishda xatolik');
    }
  };

  // Jurnal jadvali ustunlari
  const journalColumns = [
    {
      title: 'Sana',
      dataIndex: 'date',
      key: 'date',
      width: 100,
      render: (date) => moment(date).format('DD.MM.YYYY'),
      sorter: (a, b) => moment(a.date).unix() - moment(b.date).unix()
    },
    {
      title: 'Texnika',
      key: 'vehicle',
      width: 160,
      render: (record) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.vehicle.plate_number}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.vehicle.brand} {record.vehicle.model}
          </Text>
        </Space>
      )
    },
    {
      title: 'Tuman/Korxona',
      key: 'location',
      width: 140,
      render: (record) => (
        <Space direction="vertical" size="small">
          <Text>{record.vehicle.district?.name || 'N/A'}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.vehicle.company?.name || 'N/A'}
          </Text>
        </Space>
      )
    },
    {
      title: 'Holat',
      dataIndex: 'work_status',
      key: 'work_status',
      width: 110,
      render: (status) => (
        <Tag 
          color={status === 'working' ? 'green' : 'red'} 
          icon={status === 'working' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        >
          {status === 'working' ? 'Ishga chiqdi' : 'Ishga chiqmadi'}
        </Tag>
      ),
      filters: [
        { text: 'Ishga chiqdi', value: 'working' },
        { text: 'Ishga chiqmadi', value: 'not_working' }
      ],
      onFilter: (value, record) => record.work_status === value
    },
    {
      title: 'Sabab',
      key: 'reason',
      width: 150,
      render: (record) => {
        if (record.work_status === 'working') {
          return <Tag color="green">Ishga chiqdi</Tag>;
        }
        return record.reason?.name || 'Sabab ko\'rsatilmagan';
      }
    },
    {
      title: 'Vaqt',
      key: 'time',
      width: 120,
      render: (record) => (
        <Space direction="vertical" size="small">
          {record.start_time && (
            <Text style={{ fontSize: '12px' }}>
              Bosh: {record.start_time}
            </Text>
          )}
          {record.end_time && (
            <Text style={{ fontSize: '12px' }}>
              Tug: {record.end_time}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Operator',
      key: 'operator',
      width: 120,
      render: (record) => record.operator ? 
        `${record.operator.first_name} ${record.operator.last_name}` : 'N/A'
    },
    {
      title: 'Tasdiqlangan',
      key: 'confirmed',
      width: 140,
      render: (record) => (
        <Space direction="vertical" size="small">
          <Text style={{ fontSize: '12px' }}>
            {record.confirmer ? `${record.confirmer.first_name} ${record.confirmer.last_name}` : 'N/A'}
          </Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {moment(record.confirmed_at).format('DD.MM HH:mm')}
          </Text>
        </Space>
      ),
      sorter: (a, b) => moment(a.confirmed_at).unix() - moment(b.confirmed_at).unix()
    }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <CheckCircleOutlined /> Tasdiqlangan yozuvlar jurnali
            </Title>
            <Text type="secondary">
              Barcha tasdiqlangan kunlik ish holatlari yozuvlari
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchJournalData()}
                loading={loading}
              >
                Yangilash
              </Button>
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                onClick={exportToExcel}
                disabled={journalData.length === 0}
              >
                Excel ga eksport
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
              <Text strong>Sana oralig'i:</Text>
            </Space>
          </Col>
          <Col>
            <RangePicker
              value={[moment(filters.start_date), moment(filters.end_date)]}
              onChange={handleDateRangeChange}
              format="DD.MM.YYYY"
              allowClear={false}
            />
          </Col>

          {['super_admin', 'company_admin'].includes(user?.role?.name) && (
            <>
              <Col>
                <Text strong>Tuman:</Text>
              </Col>
              <Col>
                <Select
                  style={{ width: 150 }}
                  placeholder="Barcha tumanlar"
                  allowClear
                  value={filters.district_id}
                  onChange={(value) => handleFilterChange('district_id', value)}
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

          <Col>
            <Text strong>Holat:</Text>
          </Col>
          <Col>
            <Select
              style={{ width: 130 }}
              placeholder="Barcha holatlar"
              allowClear
              value={filters.work_status}
              onChange={(value) => handleFilterChange('work_status', value)}
            >
              <Option value="working">Ishga chiqdi</Option>
              <Option value="not_working">Ishga chiqmadi</Option>
            </Select>
          </Col>

          <Col>
            <Text strong>Texnika:</Text>
          </Col>
          <Col>
            <Select
              style={{ width: 150 }}
              placeholder="Barcha texnikalar"
              allowClear
              showSearch
              optionFilterProp="children"
              value={filters.vehicle_id}
              onChange={(value) => handleFilterChange('vehicle_id', value)}
            >
              {vehicles.map(vehicle => (
                <Option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate_number}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Umumiy statistika */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Jami yozuvlar</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {totalEntries}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Ishga chiqdi</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {journalData.filter(item => item.work_status === 'working').length}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Ishga chiqmadi</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                {journalData.filter(item => item.work_status === 'not_working').length}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Texnikalar</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                {new Set(journalData.map(item => item.vehicle.id)).size}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Jurnal jadvali */}
      <Card title={`Jurnal - ${totalEntries} ta yozuv`}>
        <Spin spinning={loading}>
          <Table
            columns={journalColumns}
            dataSource={journalData}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} / ${total} ta yozuv`,
              pageSizeOptions: ['10', '20', '50', '100']
            }}
            scroll={{ x: 'max-content' }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default ConfirmedJournal;
