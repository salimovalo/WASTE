import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Steps,
  Button,
  message,
  Space,
  Row,
  Col,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Upload,
  Divider,
  Table,
  Tag,
  Tooltip,
  Modal,
  Spin
} from 'antd';
import { 
  CarOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  ThunderboltOutlined,
  CameraOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import api from '../../services/api';
import useDateStore from '../../stores/dateStore';
import { useAuthStore } from '../../stores/authStore';
import './TripSheetForm.css';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

const TripSheetForm = ({ vehicleId, onSubmit, initialData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  
  // Master data
  const [vehicles, setVehicles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [fuelStations, setFuelStations] = useState([]);
  const [disposalSites, setDisposalSites] = useState([]);
  
  // Load ma'lumotlari
  const [loads, setLoads] = useState([]);
  const [loadModalVisible, setLoadModalVisible] = useState(false);
  
  // File upload
  const [fileList, setFileList] = useState([]);

  const { user } = useAuthStore();
  const { selectedDate } = useDateStore();

  useEffect(() => {
    loadMasterData();
    if (initialData) {
      populateForm(initialData);
    }
  }, []);

  const loadMasterData = async () => {
    try {
      setLoading(true);
      const [vehiclesRes, employeesRes, fuelStationsRes, disposalSitesRes] = await Promise.all([
        api.get('/technics'),
        api.get('/users'),
        api.get('/fuel-stations'),
        api.get('/disposal-sites')
      ]);

      setVehicles(vehiclesRes.data.vehicles || []);
      setEmployees(employeesRes.data.users || []);
      setFuelStations(fuelStationsRes.data.fuel_stations || []);
      setDisposalSites(disposalSitesRes.data.data || []);
    } catch (error) {
      console.error('Error loading master data:', error);
      message.error('Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (data) => {
    form.setFieldsValue({
      date: data.date ? moment(data.date) : moment(),
      vehicle_id: data.vehicle_id,
      driver_id: data.driver_id,
      loader1_id: data.loader1_id,
      loader2_id: data.loader2_id,
      odometer_start: data.odometer_start,
      odometer_end: data.odometer_end,
      work_hours_volume: data.work_hours_volume,
      work_hours_other: data.work_hours_other,
      machine_hours: data.machine_hours,
      total_trips: data.total_trips,
      other_distance: data.other_distance,
      fuel_start: data.fuel_start,
      fuel_refilled: data.fuel_refilled,
      fuel_station_id: data.fuel_station_id,
      fuel_consumption_actual: data.fuel_consumption_actual,
      fuel_consumption_norm: data.fuel_consumption_norm,
      notes: data.notes
    });
    
    if (data.loads) {
      setLoads(data.loads);
    }
    
    if (data.photo_url) {
      setFileList([{
        uid: '1',
        name: 'trip-photo.jpg',
        status: 'done',
        url: data.photo_url
      }]);
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      
      // Form validatsiyasi
      if (loads.length === 0) {
        message.error('Kamida bitta yuk ma\'lumoti qo\'shilishi kerak');
        return;
      }

      const formData = new FormData();
      
      // Asosiy ma'lumotlar
      Object.keys(values).forEach(key => {
        if (key === 'date') {
          formData.append(key, values[key].format('YYYY-MM-DD'));
        } else if (values[key] !== undefined && values[key] !== null) {
          formData.append(key, values[key]);
        }
      });
      
      // Yuk ma'lumotlari
      formData.append('loads', JSON.stringify(loads));
      
      // Rasim
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('photo', fileList[0].originFileObj);
      }

      const response = await api.post('/trip-sheets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      message.success('Yo\'l varaqasi muvaffaqiyatli saqlandi!');
      
      if (onSubmit) {
        onSubmit(response.data.data);
      }
      
      // Formni tozalash
      form.resetFields();
      setLoads([]);
      setFileList([]);
      setCurrentStep(0);

    } catch (error) {
      console.error('Error saving trip sheet:', error);
      message.error('Saqlashda xatolik: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleStepChange = (step) => {
    setCurrentStep(step);
  };

  // Auto calculations
  const calculateTotalDistance = (start, end) => {
    if (start && end && end >= start) {
      return end - start;
    }
    return 0;
  };

  const calculateFuelEnd = (start, refilled, consumed) => {
    return (start || 0) + (refilled || 0) - (consumed || 0);
  };

  const onValuesChange = (changedValues, allValues) => {
    // Spidometr o'zgarishida masofani hisoblash
    if (changedValues.odometer_start || changedValues.odometer_end) {
      const totalDistance = calculateTotalDistance(
        allValues.odometer_start, 
        allValues.odometer_end
      );
      form.setFieldsValue({ total_distance: totalDistance });
    }

    // Yoqilg'i hisobotlari
    if (changedValues.fuel_start || changedValues.fuel_refilled || changedValues.fuel_consumption_actual) {
      const fuelEnd = calculateFuelEnd(
        allValues.fuel_start,
        allValues.fuel_refilled,
        allValues.fuel_consumption_actual
      );
      form.setFieldsValue({ fuel_end: fuelEnd });
    }
    
    setFormData({ ...formData, ...changedValues });
  };

  // Yuk qo'shish/tahrirlash
  const addLoad = () => {
    setLoadModalVisible(true);
  };

  const handleLoadSubmit = (loadData) => {
    if (loadData.id) {
      // Tahrirlash
      setLoads(loads.map(load => 
        load.id === loadData.id ? loadData : load
      ));
    } else {
      // Qo'shish
      setLoads([...loads, { ...loadData, id: Date.now() }]);
    }
    setLoadModalVisible(false);
  };

  const removeLoad = (loadId) => {
    setLoads(loads.filter(load => load.id !== loadId));
  };

  // Upload handlers
  const handleUpload = ({ fileList }) => {
    setFileList(fileList);
  };

  const uploadProps = {
    name: 'photo',
    accept: 'image/*',
    fileList,
    onChange: handleUpload,
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('Faqat JPG/PNG formatdagi rasmlar qabul qilinadi!');
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Rasm hajmi 5MB dan kichik bo\'lishi kerak!');
        return false;
      }
      return false; // Prevent auto upload
    },
  };

  // Steps content
  const steps = [
    {
      title: 'Asosiy ma\'lumotlar',
      icon: <CarOutlined />,
      content: (
        <div>
          <Title level={4}>
            <CarOutlined /> Texnika va sana ma'lumotlari
          </Title>
          
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Sana"
                name="date"
                rules={[{ required: true, message: 'Sana majburiy!' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  format="DD.MM.YYYY"
                  placeholder="Sanani tanlang"
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Texnika"
                name="vehicle_id"
                rules={[{ required: true, message: 'Texnika tanlash majburiy!' }]}
              >
                <Select
                  placeholder="Texnikani tanlang"
                  showSearch
                  optionFilterProp="children"
                  disabled={!!vehicleId}
                >
                  {vehicles.map(vehicle => (
                    <Option key={vehicle.id} value={vehicle.id}>
                      <Space>
                        <CarOutlined />
                        <span>{vehicle.plate_number}</span>
                        <span style={{ color: '#999' }}>
                          ({vehicle.brand} {vehicle.model})
                        </span>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Yo'l varaqasi raqami" name="trip_number">
                <Input placeholder="Avtomatik yaratiladi" disabled />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Spidometr ko'rsatkichlari</Divider>
          
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Kun boshida (km)"
                name="odometer_start"
                rules={[
                  { required: true, message: 'Majburiy!' },
                  { type: 'number', min: 0, message: 'Musbat son bo\'lishi kerak!' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={8}>
              <Form.Item
                label="Kun oxirida (km)"
                name="odometer_end"
                rules={[
                  { required: true, message: 'Majburiy!' },
                  { type: 'number', min: 0, message: 'Musbat son bo\'lishi kerak!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('odometer_start') <= value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Kun oxirida ko\'rsatkich boshlanishdan katta bo\'lishi kerak!'));
                    },
                  }),
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={8}>
              <Form.Item label="Yurgan masofa (km)" name="total_distance">
                <InputNumber
                  style={{ width: '100%' }}
                  disabled
                  placeholder="Avtomatik hisoblanadi"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      )
    },
    {
      title: 'Xodimlar',
      icon: <TeamOutlined />,
      content: (
        <div>
          <Title level={4}>
            <TeamOutlined /> Haydovchi va yuk ortuvchilar
          </Title>
          
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Haydovchi"
                name="driver_id"
                rules={[{ required: true, message: 'Haydovchi tanlash majburiy!' }]}
              >
                <Select
                  placeholder="Haydovchini tanlang"
                  showSearch
                  optionFilterProp="children"
                >
                  {employees.filter(emp => emp.position === 'driver' || emp.role?.name === 'driver').map(emp => (
                    <Option key={emp.id} value={emp.id}>
                      <Space>
                        <TeamOutlined />
                        <span>{emp.first_name} {emp.last_name}</span>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} md={8}>
              <Form.Item label="1-yuk ortuvchi" name="loader1_id">
                <Select
                  placeholder="Birinchi yuk ortuvchi"
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {employees.filter(emp => emp.position === 'loader' || emp.role?.name === 'loader').map(emp => (
                    <Option key={emp.id} value={emp.id}>
                      <Space>
                        <TeamOutlined />
                        <span>{emp.first_name} {emp.last_name}</span>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} md={8}>
              <Form.Item label="2-yuk ortuvchi" name="loader2_id">
                <Select
                  placeholder="Ikkinchi yuk ortuvchi"
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {employees.filter(emp => emp.position === 'loader' || emp.role?.name === 'loader').map(emp => (
                    <Option key={emp.id} value={emp.id}>
                      <Space>
                        <TeamOutlined />
                        <span>{emp.first_name} {emp.last_name}</span>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>Ish vaqtlari</Divider>
          
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item 
                label="Ish soatlari (hajm)"
                name="work_hours_volume"
                tooltip="Asosiy ish uchun sarflangan soatlar"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={24}
                  step={0.5}
                  placeholder="0.0"
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={8}>
              <Form.Item 
                label="Ish soatlari (boshqa)"
                name="work_hours_other"
                tooltip="Boshqa ishlar uchun sarflangan soatlar"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={24}
                  step={0.5}
                  placeholder="0.0"
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={8}>
              <Form.Item 
                label="Mashina soatlari"
                name="machine_hours"
                tooltip="Mashina ishlaganlik vaqti"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={24}
                  step={0.5}
                  placeholder="0.0"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      )
    },
    {
      title: 'Jo\'nalishlar',
      icon: <EnvironmentOutlined />,
      content: (
        <div>
          <Title level={4}>
            <EnvironmentOutlined /> Jo'nalish va masofalar
          </Title>
          
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item 
                label="Jami jo'nalishlar soni"
                name="total_trips"
                tooltip="Bir kun davomidagi barcha jo'nalishlar"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12}>
              <Form.Item 
                label="Boshqa masofalar (km)"
                name="other_distance"
                tooltip="Yuk tashimayotgan holda yurgan masofalar"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={0.1}
                  placeholder="0.0"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Yuk ma'lumotlari</Divider>
          
          <div style={{ marginBottom: 16 }}>
            <Button 
              type="dashed" 
              onClick={addLoad}
              icon={<PlusOutlined />}
              style={{ width: '100%', height: '60px' }}
            >
              Yuk ma'lumotini qo'shish
            </Button>
          </div>

          {loads.length > 0 && (
            <Table
              dataSource={loads}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Chiqindixona',
                  dataIndex: 'disposal_site_name',
                  key: 'disposal_site'
                },
                {
                  title: 'Jo\'nalishlar',
                  dataIndex: 'trips_count',
                  key: 'trips_count',
                  align: 'center'
                },
                {
                  title: 'TBO (m³/t)',
                  key: 'tbo',
                  render: (record) => `${record.tbo_volume_m3 || 0} / ${record.tbo_weight_tn || 0}`
                },
                {
                  title: 'Smet (m³/t)',
                  key: 'smet',
                  render: (record) => `${record.smet_volume_m3 || 0} / ${record.smet_weight_tn || 0}`
                },
                {
                  title: 'Amallar',
                  key: 'actions',
                  render: (record) => (
                    <Button 
                      type="link" 
                      danger 
                      icon={<DeleteOutlined />}
                      onClick={() => removeLoad(record.id)}
                    >
                      O'chirish
                    </Button>
                  )
                }
              ]}
            />
          )}
        </div>
      )
    },
    {
      title: 'Yoqilg\'i',
      icon: <ThunderboltOutlined />,
      content: (
        <div>
          <Title level={4}>
            <ThunderboltOutlined /> Yoqilg'i hisobi
          </Title>
          
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item 
                label="Kun boshida qoldiq (l)"
                name="fuel_start"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={0.1}
                  placeholder="0.0"
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Form.Item 
                label="Olingan yoqilg'i (l)"
                name="fuel_refilled"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={0.1}
                  placeholder="0.0"
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Form.Item 
                label="Haqiqiy sarfiyot (l)"
                name="fuel_consumption_actual"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={0.1}
                  placeholder="0.0"
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Form.Item 
                label="Kun oxirida qoldiq (l)"
                name="fuel_end"
                tooltip="Avtomatik hisoblanadi"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  disabled
                  placeholder="Avtomatik"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item 
                label="Zapravka"
                name="fuel_station_id"
              >
                <Select
                  placeholder="Zapravkani tanlang"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {fuelStations.map(station => (
                    <Option key={station.id} value={station.id}>
                      <Space>
                        <ThunderboltOutlined />
                        <span>{station.name}</span>
                        <span style={{ color: '#999' }}>
                          ({station.address})
                        </span>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12}>
              <Form.Item 
                label="Normativ sarfiyot (l)"
                name="fuel_consumption_norm"
                tooltip="Normaga ko'ra bo'lishi kerak bo'lgan sarfiyot"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={0.1}
                  placeholder="0.0"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      )
    },
    {
      title: 'Rasim va izohlar',
      icon: <CameraOutlined />,
      content: (
        <div>
          <Title level={4}>
            <CameraOutlined /> Qo'shimcha ma'lumotlar
          </Title>
          
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item 
                label="Kunlik rasim"
                name="photo"
                tooltip="Texnika yoki ish jarayonining rasmi"
              >
                <Upload.Dragger 
                  {...uploadProps}
                  style={{ width: '100%' }}
                >
                  {fileList.length > 0 ? (
                    <div>
                      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />
                      <p>Rasim yuklandi</p>
                    </div>
                  ) : (
                    <div>
                      <CameraOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                      <p>Rasim yuklash uchun bosing yoki sudrab tashlang</p>
                      <p style={{ color: '#999' }}>JPG, PNG (maksimal 5MB)</p>
                    </div>
                  )}
                </Upload.Dragger>
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item 
                label="Izohlar"
                name="notes"
              >
                <TextArea
                  rows={8}
                  placeholder="Qo'shimcha ma'lumotlar, izohlar..."
                  maxLength={1000}
                  showCount
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      )
    }
  ];

  return (
    <Spin spinning={loading}>
      <Card className="trip-sheet-form">
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>
            <CarOutlined /> Yo'l varaqasi kiritish
          </Title>
          <Paragraph type="secondary">
            Texnika bo'yicha kunlik ish ma'lumotlarini to'liq kiriting. 
            Barcha majburiy maydonlarni to'ldiring.
          </Paragraph>
        </div>

        <Steps 
          current={currentStep} 
          onChange={handleStepChange}
          style={{ marginBottom: 32 }}
          responsive={false}
        >
          {steps.map((step, index) => (
            <Step 
              key={index}
              title={step.title}
              icon={step.icon}
            />
          ))}
        </Steps>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          onValuesChange={onValuesChange}
          size="large"
          scrollToFirstError
        >
          <div className="steps-content" style={{ minHeight: '400px' }}>
            {steps[currentStep].content}
          </div>

          <div className="steps-action" style={{ marginTop: 24, textAlign: 'center' }}>
            <Space size="middle">
              {currentStep > 0 && (
                <Button onClick={() => setCurrentStep(currentStep - 1)}>
                  Orqaga
                </Button>
              )}
              
              {currentStep < steps.length - 1 && (
                <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
                  Keyingisi
                </Button>
              )}
              
              {currentStep === steps.length - 1 && (
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                  size="large"
                >
                  Saqlash va yuborish
                </Button>
              )}
            </Space>
          </div>
        </Form>

        {/* Load Modal */}
        <LoadModal
          visible={loadModalVisible}
          onCancel={() => setLoadModalVisible(false)}
          onSubmit={handleLoadSubmit}
          disposalSites={disposalSites}
        />
      </Card>
    </Spin>
  );
};

// Yuk ma'lumoti qo'shish modal oynasi
const LoadModal = ({ visible, onCancel, onSubmit, disposalSites }) => {
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const selectedSite = disposalSites.find(site => site.id === values.disposal_site_id);
      onSubmit({
        ...values,
        disposal_site_name: selectedSite?.name || 'Noma\'lum'
      });
      form.resetFields();
    });
  };

  return (
    <Modal
      title="Yuk ma'lumotini qo'shish"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      width={800}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Chiqindixona"
              name="disposal_site_id"
              rules={[{ required: true, message: 'Chiqindixonani tanlang!' }]}
            >
              <Select placeholder="Chiqindixonani tanlang">
                {disposalSites.map(site => (
                  <Option key={site.id} value={site.id}>
                    <Space>
                      <EnvironmentOutlined />
                      <span>{site.name}</span>
                      <Tag color={site.type === 'tbo' ? 'blue' : 'orange'}>
                        {site.type === 'tbo' ? 'TBO' : 'SMET'}
                      </Tag>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12}>
            <Form.Item
              label="Jo'nalishlar soni"
              name="trips_count"
              rules={[{ required: true, message: 'Jo\'nalishlar sonini kiriting!' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                placeholder="0"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider>TBO (Qattiq maishiy chiqindilar)</Divider>
        
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Hajmi (m³)" name="tbo_volume_m3">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={0.1}
                placeholder="0.0"
              />
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12}>
            <Form.Item label="Og'irligi (tonna)" name="tbo_weight_tn">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={0.1}
                placeholder="0.0"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Smet (Yo'l axlati)</Divider>
        
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Hajmi (m³)" name="smet_volume_m3">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={0.1}
                placeholder="0.0"
              />
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12}>
            <Form.Item label="Og'irligi (tonna)" name="smet_weight_tn">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={0.1}
                placeholder="0.0"
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item label="Izohlar" name="notes">
          <TextArea rows={3} placeholder="Qo'shimcha ma'lumot..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TripSheetForm;
