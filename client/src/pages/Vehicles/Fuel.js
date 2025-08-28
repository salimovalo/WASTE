import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Table, 
  Button, 
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Modal,
  message,
  Row,
  Col,
  Statistic,
  Progress,
  Tabs,
  Alert,
  Tag,
  DatePicker
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  ApiOutlined,
  CarOutlined,
  BarChartOutlined,
  ShopOutlined,
  DeleteOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import useDateStore from '../../stores/dateStore';

const { Title } = Typography;
const { Option } = Select;

const Fuel = () => {
  const { user } = useAuthStore();
  const { selectedDate, getApiDate } = useDateStore();
  const [loading, setLoading] = useState(false);
  const [fuelRecords, setFuelRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [fuelStats, setFuelStats] = useState({});
  const [fuelStations, setFuelStations] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [stationModalVisible, setStationModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editingStation, setEditingStation] = useState(null);

  const [form] = Form.useForm();
  const [stationForm] = Form.useForm();

  // Yoqilg'i yozuvlarini yuklash - oylik
  const fetchFuelRecords = async () => {
    setLoading(true);
    try {
      const currentDate = selectedDate && moment.isMoment(selectedDate) ? selectedDate : moment();
      const startDate = moment(currentDate).startOf('month');
      const endDate = moment(currentDate).endOf('month');
      
      const response = await api.get('/technics/fuel-records', {
        params: {
          start_date: startDate.format('YYYY-MM-DD'),
          end_date: endDate.format('YYYY-MM-DD')
        }
      });
      setFuelRecords(response.data.records || []);
    } catch (error) {
      console.error('Error fetching fuel records:', error);
      message.error('Yoqilg\'i ma\'lumotlarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  // Yoqilg'i statistikasini yuklash
  const fetchFuelStats = async () => {
    try {
      const currentDate = selectedDate && moment.isMoment(selectedDate) ? selectedDate : moment();
      const startDate = moment(currentDate).startOf('month');
      const endDate = moment(currentDate).endOf('month');
      
      const response = await api.get('/technics/fuel-stats', {
        params: {
          start_date: startDate.format('YYYY-MM-DD'),
          end_date: endDate.format('YYYY-MM-DD')
        }
      });
      setFuelStats(response.data);
    } catch (error) {
      console.error('Error fetching fuel stats:', error);
    }
  };

  // Texnikalarni yuklash
  const fetchVehicles = async () => {
    try {
      const response = await api.get('/technics', {
        params: { limit: 1000, is_active: true }
      });
      setVehicles(response.data.vehicles || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  // Zapravkalarni yuklash
  const fetchFuelStations = async () => {
    try {
      const response = await api.get('/fuel-stations', {
        params: { limit: 1000, is_active: true }
      });
      setFuelStations(response.data.fuel_stations || []);
    } catch (error) {
      console.error('Error fetching fuel stations:', error);
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchFuelStations();
  }, []);

  useEffect(() => {
    fetchFuelRecords();
    fetchFuelStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Global sana o'zgarganda ma'lumotlarni yuklash
  useEffect(() => {
    const handleDateChange = () => {
      fetchFuelRecords();
      fetchFuelStats();
    };
    
    window.addEventListener('dateChanged', handleDateChange);
    return () => window.removeEventListener('dateChanged', handleDateChange);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Jadval ustunlari
  const columns = [
    {
      title: 'Sana',
      dataIndex: 'date',
      key: 'date',
      render: (date) => moment(date).format('DD.MM.YYYY')
    },
    {
      title: 'Texnika',
      dataIndex: 'vehicle',
      key: 'vehicle',
      render: (vehicle) => (
        <Space>
          <CarOutlined />
          <span>{vehicle?.plate_number}</span>
        </Space>
      )
    },
    {
      title: 'Yoqilg\'i miqdori',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `${amount} L`
    },
    {
      title: 'Narx (1L)',
      dataIndex: 'price_per_liter',
      key: 'price_per_liter',
      render: (price) => price ? `${price.toLocaleString()} so'm` : '-'
    },
    {
      title: 'Jami narx',
      key: 'total_price',
      render: (record) => {
        const total = record.amount * (record.price_per_liter || 0);
        return `${total.toLocaleString()} so'm`;
      }
    },
    {
      title: 'Yoqilg\'i turi',
      dataIndex: 'fuel_type',
      key: 'fuel_type',
      render: (type) => {
        const typeMap = {
          'diesel': 'Dizel',
          'gasoline': 'Benzin',
          'gas': 'Gaz'
        };
        return typeMap[type] || type;
      }
    },
    {
      title: 'Kilometr',
      dataIndex: 'odometer',
      key: 'odometer',
      render: (km) => km ? `${km.toLocaleString()} km` : '-'
    },
    {
      title: 'Amallar',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            Tahrirlash
          </Button>
        </Space>
      )
    }
  ];

  // Yangi yozuv qo'shish/tahrirlash
  const handleSubmit = async (values) => {
    try {
      if (editingRecord) {
        await api.put(`/technics/fuel-records/${editingRecord.id}`, values);
        message.success('Yoqilg\'i ma\'lumoti muvaffaqiyatli yangilandi');
      } else {
        await api.post('/technics/fuel-records', values);
        message.success('Yoqilg\'i ma\'lumoti muvaffaqiyatli qo\'shildi');
      }

      setModalVisible(false);
      setEditingRecord(null);
      form.resetFields();
      fetchFuelRecords();
      fetchFuelStats();
    } catch (error) {
      message.error(editingRecord ? 'Yangilashda xatolik' : 'Qo\'shishda xatolik');
    }
  };

  // Tahrirlash
  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      date: moment(record.date)
    });
    setModalVisible(true);
  };

  // Zapravka tahrirlash
  const handleEditStation = (station) => {
    setEditingStation(station);
    stationForm.setFieldsValue(station);
    setStationModalVisible(true);
  };

  // Zapravka o'chirish
  const handleDeleteStation = async (id) => {
    try {
      await api.delete(`/fuel-stations/${id}`);
      message.success('Zapravka muvaffaqiyatli o\'chirildi');
      fetchFuelStations();
    } catch (error) {
      message.error('O\'chirishda xatolik');
    }
  };

  // Zapravka qo'shish/yangilash
  const handleStationSubmit = async (values) => {
    try {
      const data = {
        ...values,
        company_id: user?.company_id || 1 // Foydalanuvchi kompaniyasi yoki default
      };
      
      if (editingStation) {
        await api.put(`/fuel-stations/${editingStation.id}`, data);
        message.success('Zapravka muvaffaqiyatli yangilandi');
      } else {
        await api.post('/fuel-stations', data);
        message.success('Zapravka muvaffaqiyatli qo\'shildi');
      }
      
      setStationModalVisible(false);
      setEditingStation(null);
      stationForm.resetFields();
      fetchFuelStations();
    } catch (error) {
      console.error('Zapravka error:', error);
      const errorMsg = error.response?.data?.error || (editingStation ? 'Yangilashda xatolik' : 'Qo\'shishda xatolik');
      message.error(errorMsg);
    }
  };

  // Yoqilg'i samaradorligini hisoblash
  const calculateEfficiency = (vehicle) => {
    const vehicleRecords = fuelRecords.filter(r => r.vehicle_id === vehicle.id);
    if (vehicleRecords.length < 2) return null;

    const totalFuel = vehicleRecords.reduce((sum, r) => sum + r.amount, 0);
    const sortedRecords = vehicleRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstRecord = sortedRecords[0];
    const lastRecord = sortedRecords[sortedRecords.length - 1];
    
    if (!firstRecord.odometer || !lastRecord.odometer) return null;
    
    const distance = lastRecord.odometer - firstRecord.odometer;
    if (distance <= 0) return null;

    return (totalFuel / distance * 100).toFixed(2);
  };

  return (
    <div className="fuel-page">
      <div className="page-header">
        <Title level={2}>
          <ApiOutlined /> Yoqilg'i boshqaruvi
        </Title>
        <Space>
          <Tag color="blue" style={{ padding: '4px 12px', fontSize: '14px' }}>
            <CalendarOutlined /> 
            {selectedDate && moment.isMoment(selectedDate) ? selectedDate.format('MMMM YYYY') : moment().format('MMMM YYYY')}
          </Tag>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingRecord(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            Yoqilg'i qo'shish
          </Button>
        </Space>
      </div>

      <Tabs 
        defaultActiveKey="records"
        items={[
          {
            key: 'records',
            label: "Yoqilg'i yozuvlari",
            children: (
              <>
                {/* Umumiy statistika */}
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Jami yoqilg'i"
                        value={fuelStats.totalFuel || 0}
                        suffix="L"
                        precision={1}
                        prefix={<ApiOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Jami xarajat"
                        value={fuelStats.totalCost || 0}
                        precision={0}
                        prefix="$"
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="O'rtacha narx"
                        value={fuelStats.averagePrice || 0}
                        suffix="so'm/L"
                        precision={0}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Yozuvlar soni"
                        value={fuelRecords.length}
                        prefix={<BarChartOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* Jadval */}
                <Card>
                  <Table
                    columns={columns}
                    dataSource={fuelRecords}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 15 }}
                    scroll={{ x: 'max-content' }}
                  />
                </Card>
              </>
            )
          },

          {
            key: 'analysis',
            label: 'Sarfiyot tahlili',
            children: (
              <Row gutter={16}>
                <Col span={24}>
                  <Card title="Texnikalar bo'yicha yoqilg'i sarfi">
                    {vehicles.map(vehicle => {
                      const efficiency = calculateEfficiency(vehicle);
                      const vehicleFuel = fuelRecords
                        .filter(r => r.vehicle_id === vehicle.id)
                        .reduce((sum, r) => sum + r.amount, 0);
                      
                      const normalConsumption = vehicle.fuel_consumption_per_100km || 25;
                      const efficiencyPercent = efficiency ? 
                        Math.min(100, Math.max(0, 100 - ((efficiency - normalConsumption) / normalConsumption * 100))) : 50;

                      return (
                        <Card 
                          key={vehicle.id} 
                          size="small" 
                          style={{ marginBottom: 16 }}
                          title={`${vehicle.plate_number} (${vehicle.brand} ${vehicle.model})`}
                        >
                          <Row gutter={16}>
                            <Col span={8}>
                              <Statistic
                                title="Sarflangan yoqilg'i"
                                value={vehicleFuel}
                                suffix="L"
                                precision={1}
                              />
                            </Col>
                            <Col span={8}>
                              <Statistic
                                title="100km sarfi"
                                value={efficiency || 'Ma\'lumot yo\'q'}
                                suffix={efficiency ? 'L' : ''}
                                precision={2}
                              />
                            </Col>
                            <Col span={8}>
                              <div style={{ marginBottom: 8 }}>
                                <span style={{ fontSize: 14, color: '#666' }}>Samaradorlik</span>
                              </div>
                              <Progress
                                percent={efficiencyPercent}
                                status={efficiencyPercent > 70 ? 'success' : efficiencyPercent > 40 ? 'normal' : 'exception'}
                                strokeColor={efficiencyPercent > 70 ? '#52c41a' : efficiencyPercent > 40 ? '#1890ff' : '#ff4d4f'}
                              />
                            </Col>
                          </Row>
                          
                          {efficiency && (
                            <Alert
                              message={
                                efficiency > normalConsumption + 5 ? 
                                  `Yuqori sarfiyot! Norma: ${normalConsumption}L/100km` :
                                efficiency < normalConsumption - 2 ?
                                  `Samarali sarfiyot! Norma: ${normalConsumption}L/100km` :
                                  `Normal sarfiyot. Norma: ${normalConsumption}L/100km`
                              }
                              type={
                                efficiency > normalConsumption + 5 ? 'warning' :
                                efficiency < normalConsumption - 2 ? 'success' : 'info'
                              }
                              showIcon
                              style={{ marginTop: 12 }}
                            />
                          )}
                        </Card>
                      );
                    })}
                  </Card>
                </Col>
              </Row>
            )
          },

          {
            key: 'stations',
            label: 'Zapravkalar',
            children: (
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={24}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingStation(null);
                  stationForm.resetFields();
                  setStationModalVisible(true);
                }}
                style={{ marginBottom: 16 }}
              >
                Yangi zapravka qo'shish
              </Button>

              <Table
                columns={[
                  {
                    title: 'Nom',
                    dataIndex: 'name',
                    key: 'name',
                    render: (text) => (
                      <Space>
                        <ShopOutlined />
                        <span style={{ fontWeight: 500 }}>{text}</span>
                      </Space>
                    )
                  },
                  {
                    title: 'IIN raqami',
                    dataIndex: 'iin_number',
                    key: 'iin_number',
                    render: (text) => <Tag color="blue">{text}</Tag>
                  },
                  {
                    title: 'Yoqilg\'i turi',
                    dataIndex: 'fuel_type',
                    key: 'fuel_type',
                    render: (fuel) => {
                      const color = fuel === 'gas' ? 'green' : fuel === 'diesel' ? 'orange' : 'blue';
                      const label = fuel === 'gas' ? 'Gaz' : fuel === 'diesel' ? 'Dizel' : 'Benzin';
                      return <Tag color={color}>{label}</Tag>;
                    }
                  },
                  {
                    title: 'Narx (1L)',
                    dataIndex: 'current_price_per_liter',
                    key: 'current_price_per_liter',
                    render: (price) => price ? `${Number(price).toLocaleString()} so'm` : '-'
                  },
                  {
                    title: 'Manzil',
                    dataIndex: 'address',
                    key: 'address',
                    render: (address) => address || '-'
                  },
                  {
                    title: 'Amallar',
                    key: 'actions',
                    render: (_, record) => (
                      <Space>
                        <Button
                          icon={<EditOutlined />}
                          size="small"
                          onClick={() => handleEditStation(record)}
                        >
                          Tahrirlash
                        </Button>
                        <Button
                          icon={<DeleteOutlined />}
                          size="small"
                          danger
                          onClick={() => handleDeleteStation(record.id)}
                        >
                          O'chirish
                        </Button>
                      </Space>
                    )
                  }
                ]}
                dataSource={fuelStations}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 'max-content' }}
              />
            </Col>
          </Row>
            )
          },
          {
            key: 'prices',
            label: 'Narxlar tahlili',
            children: (
          <Row gutter={16}>
            <Col span={24}>
              <Card title="Yoqilg'i narxlari dinamikasi">
                <Alert
                  message="Narxlar tahlili"
                  description="Bu bo'limda yoqilg'i narxlarining o'zgarishi va texnikalar bo'yicha xarajatlar tahlili ko'rsatiladi."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                {/* Bu yerda narxlar grafigi bo'lishi mumkin */}
              </Card>
            </Col>
          </Row>
            )
          }
        ]}
      />

      {/* Yoqilg'i qo'shish/tahrirlash modal */}
      <Modal
        title={editingRecord ? 'Yoqilg\'i ma\'lumotini tahrirlash' : 'Yangi yoqilg\'i yozuvi'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingRecord(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="vehicle_id"
                label="Texnika"
                rules={[{ required: true, message: 'Texnikani tanlang' }]}
              >
                <Select placeholder="Texnikani tanlang" showSearch>
                  {vehicles.map(vehicle => (
                    <Option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate_number} ({vehicle.brand} {vehicle.model})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="date"
                label="Sana"
                rules={[{ required: true, message: 'Sanani tanlang' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  format="DD.MM.YYYY"
                  disabledDate={(current) => current && current.isAfter(moment().endOf('day'))}
                  inputReadOnly
                  picker="date"
                  placeholder="Sanani tanlang"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Yoqilg'i miqdori (litr)"
                rules={[{ required: true, message: 'Yoqilg\'i miqdorini kiriting' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  min={0.1}
                  step={0.1}
                  placeholder="25.5"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fuel_type"
                label="Yoqilg'i turi"
                rules={[{ required: true, message: 'Yoqilg\'i turini tanlang' }]}
              >
                <Select placeholder="Yoqilg'i turini tanlang">
                  <Option value="diesel">Dizel</Option>
                  <Option value="gasoline">Benzin</Option>
                  <Option value="gas">Gaz</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price_per_liter"
                label="Narx (1 litr, so'm)"
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="8500"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="odometer"
                label="Kilometr ko'rsatkichi"
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="125000"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Izoh">
            <Input.TextArea 
              rows={3}
              placeholder="Qo'shimcha izohlar..."
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingRecord ? 'Yangilash' : 'Qo\'shish'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingRecord(null);
                form.resetFields();
              }}>
                Bekor qilish
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Zapravka qo'shish/tahrirlash modal */}
      <Modal
        title={editingStation ? 'Zapravkani tahrirlash' : 'Yangi zapravka qo\'shish'}
        open={stationModalVisible}
        onCancel={() => {
          setStationModalVisible(false);
          setEditingStation(null);
          stationForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={stationForm}
          layout="vertical"
          onFinish={handleStationSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Zapravka nomi"
                rules={[{ required: true, message: 'Zapravka nomi talab qilinadi' }]}
              >
                <Input placeholder="Zapravka nomi" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="iin_number"
                label="IIN raqami"
                rules={[
                  { required: true, message: 'IIN raqami talab qilinadi' },
                  { pattern: /^\d{9,20}$/, message: 'IIN raqami 9-20 raqamdan iborat bo\'lishi kerak' }
                ]}
              >
                <Input placeholder="123456789" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fuel_type"
                label="Yoqilg'i turi"
                rules={[{ required: true, message: 'Yoqilg\'i turi talab qilinadi' }]}
              >
                <Select placeholder="Yoqilg'i turini tanlang">
                  <Option value="gas">Gaz</Option>
                  <Option value="diesel">Dizel</Option>
                  <Option value="gasoline">Benzin</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="current_price_per_liter"
                label="Yoqilg'i narxi (1 litr, so'm)"
                rules={[{ required: true, message: 'Yoqilg\'i narxi talab qilinadi' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  min={1}
                  placeholder="8500"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Manzil"
          >
            <Input.TextArea 
              rows={2}
              placeholder="Zapravka manzili"
            />
          </Form.Item>



          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingStation ? 'Yangilash' : 'Qo\'shish'}
              </Button>
              <Button onClick={() => {
                setStationModalVisible(false);
                setEditingStation(null);
                stationForm.resetFields();
              }}>
                Bekor qilish
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Fuel;
