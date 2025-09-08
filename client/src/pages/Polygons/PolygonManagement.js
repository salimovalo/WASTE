import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  message,
  Popconfirm,
  Tag,
  Tooltip,
  Row,
  Col,
  InputNumber,
  Switch,
  Divider,
  Badge,
  Typography
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const PolygonManagement = () => {
  const [polygons, setPolygons] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPolygon, setEditingPolygon] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  
  const { user } = useAuthStore();

  useEffect(() => {
    loadPolygons();
    loadDistricts();
    loadCompanies();
  }, []);

  const loadPolygons = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 100,
        is_active: showInactive ? undefined : true
      };
      
      if (searchText) params.search = searchText;
      if (selectedDistrict) params.district_id = selectedDistrict;
      if (selectedCompany) params.company_id = selectedCompany;
      
      const response = await api.get('/polygons', { params });
      setPolygons(response.data.polygons || []);
    } catch (error) {
      console.error('Poligonlarni yuklashda xatolik:', error);
      message.error('Poligonlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const loadDistricts = async () => {
    try {
      const response = await api.get('/districts', { 
        params: { limit: 100, is_active: true } 
      });
      setDistricts(response.data.districts || []);
    } catch (error) {
      console.error('Tumanlarni yuklashda xatolik:', error);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await api.get('/companies', { 
        params: { limit: 100, is_active: true } 
      });
      setCompanies(response.data.companies || []);
    } catch (error) {
      console.error('Korxonalarni yuklashda xatolik:', error);
    }
  };

  const handleSearch = () => {
    loadPolygons();
  };

  const handleReset = () => {
    setSearchText('');
    setSelectedDistrict(null);
    setSelectedCompany(null);
    setShowInactive(false);
    setTimeout(() => loadPolygons(), 100);
  };

  const handleAdd = () => {
    setEditingPolygon(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (polygon) => {
    setEditingPolygon(polygon);
    form.setFieldsValue({
      ...polygon,
      waste_types: polygon.waste_types || []
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/polygons/${id}`);
      message.success('Poligon muvaffaqiyatli o\'chirildi');
      loadPolygons();
    } catch (error) {
      console.error('Poligonni o\'chirishda xatolik:', error);
      message.error('Poligonni o\'chirishda xatolik yuz berdi');
    }
  };

  const handleActivate = async (id) => {
    try {
      await api.patch(`/polygons/${id}/activate`);
      message.success('Poligon muvaffaqiyatli faollashtirildi');
      loadPolygons();
    } catch (error) {
      console.error('Poligonni faollashtirish xatolik:', error);
      message.error('Poligonni faollashtirish xatolik yuz berdi');
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      const payload = {
        ...values,
        coordinates: values.coordinates ? {
          lat: parseFloat(values.lat),
          lng: parseFloat(values.lng)
        } : null
      };
      
      delete payload.lat;
      delete payload.lng;
      
      if (editingPolygon) {
        await api.put(`/polygons/${editingPolygon.id}`, payload);
        message.success('Poligon muvaffaqiyatli yangilandi');
      } else {
        await api.post('/polygons', payload);
        message.success('Poligon muvaffaqiyatli yaratildi');
      }
      
      setModalVisible(false);
      form.resetFields();
      loadPolygons();
    } catch (error) {
      console.error('Poligonni saqlashda xatolik:', error);
      message.error('Poligonni saqlashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '№',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1
    },
    {
      title: 'Nomi',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          {record.code && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              Kod: {record.code}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Manzil',
      dataIndex: 'address',
      key: 'address',
      render: (text) => (
        <Tooltip title={text}>
          <Text ellipsis style={{ maxWidth: 200 }}>
            {text || '-'}
          </Text>
        </Tooltip>
      )
    },
    {
      title: 'Tuman',
      dataIndex: 'district',
      key: 'district',
      render: (district) => district?.name || '-'
    },
    {
      title: 'Korxona',
      dataIndex: 'company',
      key: 'company',
      render: (company) => company?.name || '-'
    },
    {
      title: 'Sig\'im (m³)',
      dataIndex: 'capacity_m3',
      key: 'capacity_m3',
      align: 'center',
      render: (capacity) => capacity ? `${Number(capacity).toLocaleString()} m³` : '-'
    },
    {
      title: 'Joriy hajm (m³)',
      dataIndex: 'current_volume_m3',
      key: 'current_volume_m3',
      align: 'center',
      render: (current, record) => {
        const capacity = record.capacity_m3;
        const currentVol = Number(current || 0);
        const percentage = capacity ? (currentVol / capacity * 100) : 0;
        
        return (
          <div>
            <Text>{currentVol.toLocaleString()} m³</Text>
            {capacity && (
              <div style={{ fontSize: '11px', color: '#666' }}>
                {percentage.toFixed(1)}% to'lgan
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Narx (m³)',
      dataIndex: 'price_per_m3',
      key: 'price_per_m3',
      align: 'center',
      render: (price) => price ? `${Number(price).toLocaleString()} so'm` : '-'
    },
    {
      title: 'Holat',
      dataIndex: 'is_active',
      key: 'is_active',
      align: 'center',
      render: (isActive, record) => (
        <div>
          <Badge 
            status={isActive ? 'success' : 'error'} 
            text={isActive ? 'Faol' : 'Nofaol'} 
          />
          {record.is_public && (
            <div>
              <Tag color="blue" size="small">Ommaviy</Tag>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Amallar',
      key: 'actions',
      align: 'center',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Tahrirlash">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            />
          </Tooltip>
          
          {record.is_active ? (
            <Popconfirm
              title="Bu poligonni o'chirishni xohlaysizmi?"
              onConfirm={() => handleDelete(record.id)}
              okText="Ha"
              cancelText="Yo'q"
            >
              <Tooltip title="O'chirish">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                />
              </Tooltip>
            </Popconfirm>
          ) : (
            <Tooltip title="Faollashtirish">
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                onClick={() => handleActivate(record.id)}
                size="small"
                style={{ color: '#52c41a' }}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  const wasteTypeOptions = [
    { label: 'Maishiy chiqindilar (TBO)', value: 'tbo' },
    { label: 'Qurilish chiqindilari', value: 'construction' },
    { label: 'Organik chiqindilar', value: 'organic' },
    { label: 'Qayta ishlash mumkin', value: 'recyclable' },
    { label: 'Xavfli chiqindilar', value: 'hazardous' },
    { label: 'Boshqa', value: 'other' }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={3} style={{ margin: 0 }}>
                <EnvironmentOutlined style={{ marginRight: 8 }} />
                Poligonlar boshqaruvi
              </Title>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                Yangi poligon
              </Button>
            </Col>
          </Row>
        </div>

        {/* Filters */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col span={6}>
              <Input
                placeholder="Poligon nomi yoki kodi"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                suffix={<SearchOutlined />}
              />
            </Col>
            
            <Col span={4}>
              <Select
                placeholder="Tuman"
                value={selectedDistrict}
                onChange={setSelectedDistrict}
                allowClear
                style={{ width: '100%' }}
              >
                {districts.map(district => (
                  <Option key={district.id} value={district.id}>
                    {district.name}
                  </Option>
                ))}
              </Select>
            </Col>
            
            <Col span={4}>
              <Select
                placeholder="Korxona"
                value={selectedCompany}
                onChange={setSelectedCompany}
                allowClear
                style={{ width: '100%' }}
              >
                {companies.map(company => (
                  <Option key={company.id} value={company.id}>
                    {company.name}
                  </Option>
                ))}
              </Select>
            </Col>
            
            <Col span={4}>
              <Switch
                checked={showInactive}
                onChange={setShowInactive}
                checkedChildren="Nofaollar"
                unCheckedChildren="Faollar"
              />
            </Col>
            
            <Col span={6}>
              <Space>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                >
                  Qidirish
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                >
                  Tozalash
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={polygons}
          loading={loading}
          rowKey="id"
          pagination={{
            total: polygons.length,
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Jami: ${total} ta poligon`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingPolygon ? 'Poligonni tahrirlash' : 'Yangi poligon qo\'shish'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            is_active: true,
            is_public: true,
            waste_types: ['tbo']
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Poligon nomi"
                rules={[
                  { required: true, message: 'Poligon nomini kiriting' },
                  { min: 2, message: 'Kamida 2 ta belgi kiriting' }
                ]}
              >
                <Input placeholder="Masalan: Toshkent poligoni" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="code"
                label="Kod"
              >
                <Input placeholder="Masalan: TSH-001" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Tavsif"
          >
            <TextArea rows={3} placeholder="Poligon haqida qo'shimcha ma'lumot" />
          </Form.Item>

          <Form.Item
            name="address"
            label="Manzil"
          >
            <TextArea rows={2} placeholder="To'liq manzil" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="district_id"
                label="Tuman"
              >
                <Select placeholder="Tuman tanlang" allowClear>
                  {districts.map(district => (
                    <Option key={district.id} value={district.id}>
                      {district.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="company_id"
                label="Korxona"
              >
                <Select placeholder="Korxona tanlang" allowClear>
                  {companies.map(company => (
                    <Option key={company.id} value={company.id}>
                      {company.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="price_per_m3"
                label="Narx (m³ uchun)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="so'm"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="capacity_m3"
                label="Sig'im (m³)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="current_volume_m3"
                label="Joriy hajm (m³)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">GPS Koordinatalar</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="lat"
                label="Kenglik (Latitude)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  step={0.000001}
                  precision={6}
                  placeholder="41.123456"
                />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="lng"
                label="Uzunlik (Longitude)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  step={0.000001}
                  precision={6}
                  placeholder="69.123456"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Aloqa ma'lumotlari</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contact_person"
                label="Mas'ul shaxs"
              >
                <Input placeholder="Ism familiya" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="contact_phone"
                label="Telefon raqam"
              >
                <Input placeholder="+998 90 123 45 67" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="operating_hours"
            label="Ish vaqti"
          >
            <Input placeholder="Masalan: 08:00-18:00" />
          </Form.Item>

          <Form.Item
            name="waste_types"
            label="Qabul qilinadigan chiqindi turlari"
          >
            <Select
              mode="multiple"
              placeholder="Chiqindi turlarini tanlang"
              options={wasteTypeOptions}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="is_public"
                label="Ommaviy foydalanish"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="Faol holat"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Bekor qilish
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingPolygon ? 'Yangilash' : 'Qo\'shish'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PolygonManagement;
