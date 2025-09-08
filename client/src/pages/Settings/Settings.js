import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Tabs, 
  Form, 
  Input, 
  Select, 
  Switch, 
  Button, 
  Table, 
  Modal, 
  message,
  Space,
  Popconfirm,
  Tag,
  Row,
  Col,
  Divider,
  InputNumber
} from 'antd';
import {
  SettingOutlined,
  CloudOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const Settings = () => {
  const [weatherConfig, setWeatherConfig] = useState(null);
  const [weatherLocations, setWeatherLocations] = useState({ mapped: [], unmapped: [] });
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [form] = Form.useForm();
  const [configForm] = Form.useForm();

  useEffect(() => {
    loadWeatherConfig();
    loadWeatherLocations();
  }, []);

  const loadWeatherConfig = async () => {
    try {
      const response = await api.get('/weather/config');
      setWeatherConfig(response.data.data);
      configForm.setFieldsValue(response.data.data);
    } catch (error) {
      if (error.response?.status !== 404) {
        message.error('Ob-havo konfiguratsiyasini yuklashda xatolik');
      }
    }
  };

  const loadWeatherLocations = async () => {
    try {
      const response = await api.get('/weather/locations');
      setWeatherLocations(response.data.data);
    } catch (error) {
      message.error('Ob-havo joylashuvlarini yuklashda xatolik');
    }
  };

  const handleConfigSave = async (values) => {
    setLoading(true);
    try {
      await api.put('/weather/config', values);
      message.success('Konfiguratsiya saqlandi');
      loadWeatherConfig();
    } catch (error) {
      message.error(error.response?.data?.message || 'Konfiguratsiyani saqlashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSave = async (values) => {
    setLoading(true);
    try {
      await api.post('/weather/locations', values);
      message.success('Joylashuv saqlandi');
      loadWeatherLocations();
      setModalVisible(false);
      form.resetFields();
      setEditingLocation(null);
    } catch (error) {
      message.error(error.response?.data?.message || 'Joylashuvni saqlashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationDelete = async (id) => {
    try {
      await api.delete(`/weather/locations/${id}`);
      message.success('Joylashuv o\'chirildi');
      loadWeatherLocations();
    } catch (error) {
      message.error('Joylashuvni o\'chirishda xatolik');
    }
  };

  const handleFetchWeather = async () => {
    setLoading(true);
    try {
      const response = await api.post('/weather/fetch');
      const { results, errors } = response.data.data;
      
      if (results.length > 0) {
        message.success(`${results.length} ta tuman uchun ob-havo ma'lumotlari yangilandi`);
      }
      
      if (errors.length > 0) {
        message.warning(`${errors.length} ta tumanda xatolik bo'ldi`);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Ob-havo ma\'lumotlarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const weatherColumns = [
    {
      title: 'Tuman',
      dataIndex: ['district', 'name'],
      key: 'district',
    },
    {
      title: 'Ob-havo shahri',
      dataIndex: 'weather_city',
      key: 'weather_city',
    },
    {
      title: 'Koordinatalar',
      key: 'coordinates',
      render: (_, record) => {
        if (record.latitude && record.longitude) {
          return `${parseFloat(record.latitude).toFixed(4)}, ${parseFloat(record.longitude).toFixed(4)}`;
        }
        return '-';
      }
    },
    {
      title: 'Holat',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.is_active ? 'green' : 'red'}>
          {record.is_active ? 'Faol' : 'Nofaol'}
        </Tag>
      )
    },
    {
      title: 'Amallar',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingLocation(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          >
            Tahrirlash
          </Button>
          <Popconfirm
            title="Joylashuvni o'chirishga ishonchingiz komilmi?"
            onConfirm={() => handleLocationDelete(record.id)}
            okText="Ha"
            cancelText="Yo'q"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              O'chirish
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="settings-page">
      <Title level={2}>
        <SettingOutlined /> Tizim Sozlamalari
      </Title>
      
      <Tabs defaultActiveKey="weather" type="card">
        <TabPane 
          tab={<span><CloudOutlined />Ob-havo API</span>} 
          key="weather"
        >
          <Row gutter={[24, 24]}>
            {/* API Konfiguratsiya */}
            <Col span={24}>
              <Card 
                title={<><CloudOutlined /> API Konfiguratsiya</>}
                extra={
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={handleFetchWeather}
                    loading={loading}
                  >
                    Ma'lumotlarni yangilash
                  </Button>
                }
              >
                <Form
                  form={configForm}
                  layout="vertical"
                  onFinish={handleConfigSave}
                  initialValues={{
                    api_provider: 'weatherapi',
                    update_interval: 3600,
                    auto_update: true
                  }}
                >
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        name="api_provider"
                        label="API Provayder"
                        rules={[{ required: true, message: 'API provayderint tanlang' }]}
                      >
                        <Select>
                          <Option value="weatherapi">WeatherAPI.com</Option>
                          <Option value="openweather">OpenWeatherMap</Option>
                          <Option value="accuweather">AccuWeather</Option>
                          <Option value="visualcrossing">Visual Crossing</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    
                    <Col span={8}>
                      <Form.Item
                        name="api_key"
                        label="API Key"
                        rules={[{ required: true, message: 'API kalitini kiriting' }]}
                      >
                        <Input.Password 
                          placeholder="API kalitingizni kiriting" 
                          defaultValue="86d37b917bf0444798a90831253008"
                        />
                      </Form.Item>
                    </Col>
                    
                    <Col span={8}>
                      <Form.Item
                        name="update_interval"
                        label="Yangilanish davri (soniya)"
                        rules={[{ required: true, message: 'Yangilanish davrini kiriting' }]}
                      >
                        <InputNumber min={300} max={86400} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="auto_update" valuePropName="checked">
                        <Switch checkedChildren="Avtomatik" unCheckedChildren="Qo'lda" />
                        <Text style={{ marginLeft: 8 }}>Avtomatik yangilanish</Text>
                      </Form.Item>
                    </Col>
                    
                    <Col span={16}>
                      <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                          <CheckOutlined /> Konfiguratsiyani saqlash
                        </Button>
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Card>
            </Col>

            {/* Tumanlar xaritasi */}
            <Col span={24}>
              <Card 
                title={<><EnvironmentOutlined /> Tumanlar va Ob-havo Joylashuvlari</>}
                extra={
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingLocation(null);
                      form.resetFields();
                      setModalVisible(true);
                    }}
                  >
                    Joylashuv qo'shish
                  </Button>
                }
              >
                <Table
                  dataSource={weatherLocations.mapped}
                  columns={weatherColumns}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  size="small"
                />

                {weatherLocations.unmapped.length > 0 && (
                  <>
                    <Divider>Bog'lanmagan tumanlar</Divider>
                    <div style={{ marginBottom: 16 }}>
                      <Text type="secondary">
                        {weatherLocations.unmapped.length} ta tuman ob-havo ma'lumotlariga bog'lanmagan
                      </Text>
                    </div>
                    {weatherLocations.unmapped.map(district => (
                      <Tag 
                        key={district.id} 
                        color="orange" 
                        style={{ margin: 4 }}
                        onClick={() => {
                          setEditingLocation(null);
                          form.setFieldsValue({ 
                            district_id: district.id,
                            weather_city: district.name 
                          });
                          setModalVisible(true);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        {district.name}
                      </Tag>
                    ))}
                  </>
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane 
          tab={<span><SettingOutlined />Boshqa sozlamalar</span>} 
          key="other"
        >
          <Card>
            <p>Qo'shimcha tizim sozlamalari bu yerda bo'ladi:</p>
            <ul>
              <li>Foydalanuvchi sozlamalari</li>
              <li>Tariflar sozlash</li>
              <li>Sistema konfiguratsiyasi</li>
              <li>Hisobot sozlamalari</li>
            </ul>
          </Card>
        </TabPane>
      </Tabs>

      {/* Joylashuv Modal */}
      <Modal
        title={editingLocation ? "Joylashuvni tahrirlash" : "Yangi joylashuv qo'shish"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingLocation(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleLocationSave}
        >
          <Form.Item
            name="district_id"
            label="Tuman"
            rules={[{ required: true, message: 'Tumanni tanlang' }]}
          >
            <Select placeholder="Tumanni tanlang" showSearch>
              {[...weatherLocations.mapped, ...weatherLocations.unmapped].map(item => (
                <Option 
                  key={item.district?.id || item.id} 
                  value={item.district?.id || item.id}
                >
                  {item.district?.name || item.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="weather_city"
            label="Ob-havo shahar nomi"
            rules={[{ required: true, message: 'Shahar nomini kiriting' }]}
            extra="API da qidirish uchun shahar nomi (masalan: Tashkent, Angren)"
          >
            <Input placeholder="Shahar nomi" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="latitude"
                label="Kenglik (Latitude)"
                extra="Ixtiyoriy - aniq koordinatalar"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="41.2995"
                  min={-90}
                  max={90}
                  precision={6}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="longitude"
                label="Uzunlik (Longitude)"
                extra="Ixtiyoriy - aniq koordinatalar"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="69.2401"
                  min={-180}
                  max={180}
                  precision={6}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                <CheckOutlined /> Saqlash
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                <CloseOutlined /> Bekor qilish
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Settings;
