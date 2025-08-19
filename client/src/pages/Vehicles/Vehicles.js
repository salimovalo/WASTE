import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Table, 
  Button, 
  Input, 
  Select, 
  Space, 
  Modal, 
  Form, 
  InputNumber, 
  message, 
  Upload, 
  Popconfirm,
  Tag,
  Row,
  Col,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined,
  UploadOutlined,

  CarOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useSelectedCompany } from '../../components/Layout/CompanySelector';
import api from '../../services/api';
import './Vehicles.css';

const { Title } = Typography;
const { Option } = Select;

const Vehicles = () => {
  const { user } = useAuthStore();
  const { selectedCompany: globalSelectedCompany, selectedDistrict: globalSelectedDistrict } = useSelectedCompany();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);

  const [districts, setDistricts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedFuelType, setSelectedFuelType] = useState('diesel');
  const [selectedCompany, setSelectedCompany] = useState(null); // Excel import uchun mahalliy state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    vehicle_type: '',
    fuel_type: '',
    is_active: ''
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Vehicle turlari
  const vehicleTypes = [
    { value: 'garbage_truck', label: 'Chiqindi yig\'ish mashinasi' },
    { value: 'container_truck', label: 'Konteyner mashinasi' },
    { value: 'compactor_truck', label: 'Pressa mashinasi' },
    { value: 'pickup_truck', label: 'Pikap' },
    { value: 'other', label: 'Boshqa' }
  ];

  // Yoqilg'i turlari
  const fuelTypes = [
    { value: 'diesel', label: 'Dizel' },
    { value: 'gasoline', label: 'Benzin' },
    { value: 'gas', label: 'Gaz' },
    { value: 'electric', label: 'Elektr' },
    { value: 'hybrid', label: 'Gibrid' }
  ];

  // Ma'lumotlarni yuklash
  const fetchVehicles = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        ...filters
      };

      // Global tanlangan korxona va tuman bo'yicha filter
      if (globalSelectedCompany?.id) {
        params.company_id = globalSelectedCompany.id;
      }
      
      if (globalSelectedDistrict?.id) {
        params.district_id = globalSelectedDistrict.id;
      }

      const response = await api.get('/technics', { params });
      setVehicles(response.data.vehicles);
      setPagination({
        current: page,
        pageSize,
        total: response.data.pagination.total_items
      });
    } catch (error) {
      message.error('Texnikalar ro\'yxatini yuklashda xatolik');
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };



  // Tumanlarni yuklash
  const fetchDistricts = async (companyId) => {
    try {
      const response = await api.get('/districts', {
        params: { company_id: companyId, limit: 1000 }
      });
      setDistricts(response.data.districts || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  // Korxonalarni yuklash
  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies', {
        params: { limit: 1000 }
      });
      setCompanies(response.data.companies || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [filters, globalSelectedCompany, globalSelectedDistrict]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user?.role?.name === 'super_admin') {
      fetchCompanies();
    } else if (user?.company_id) {
      fetchDistricts(user.company_id);
    }
  }, [user]);

  // Jadval ustunlari
  const columns = [
    {
      title: 'Davlat raqami',
      dataIndex: 'plate_number',
      key: 'plate_number',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Marka/Model',
      key: 'brand_model',
      render: (record) => `${record.brand || ''} ${record.model || ''}`.trim()
    },
    {
      title: 'Turi',
      dataIndex: 'vehicle_type',
      key: 'vehicle_type',
      render: (type) => {
        const typeObj = vehicleTypes.find(t => t.value === type);
        return typeObj ? typeObj.label : type;
      }
    },
    {
      title: 'Yoqilg\'i turi',
      dataIndex: 'fuel_type',
      key: 'fuel_type',
      render: (fuel) => {
        const fuelObj = fuelTypes.find(f => f.value === fuel);
        return fuelObj ? fuelObj.label : fuel;
      }
    },
    {
      title: 'Yil',
      dataIndex: 'year',
      key: 'year'
    },
    {
      title: 'Sig\'im (m³)',
      dataIndex: 'capacity_m3',
      key: 'capacity_m3',
      render: (value) => value ? `${value} m³` : '-'
    },
    {
      title: 'Holati',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Faol' : 'Faol emas'}
        </Tag>
      )
    },
    {
      title: 'Amallar',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Tahrirlash
          </Button>
          <Popconfirm
            title="Texnikani o'chirmoqchimisiz?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ha"
            cancelText="Yo'q"
          >
            <Button
              icon={<DeleteOutlined />}
              danger
              size="small"
            >
              O'chirish
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Yangi texnika qo'shish/tahrirlash
  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        company_id: values.company_id || user?.company_id
      };
      
      if (editingVehicle) {
        await api.put(`/technics/${editingVehicle.id}`, data);
        message.success('Texnika muvaffaqiyatli yangilandi');
      } else {
        await api.post('/technics', data);
        message.success('Texnika muvaffaqiyatli qo\'shildi');
      }
      
      setModalVisible(false);
      setEditingVehicle(null);
      form.resetFields();
      fetchVehicles(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Vehicle submit error:', error);
      
      // Server validatsiya xatoliklarini ko'rsatish
      if (error.response?.status === 400 && error.response?.data?.details) {
        const validationErrors = error.response.data.details;
        validationErrors.forEach(err => {
          message.error(`${err.field}: ${err.message}`);
        });
      } else {
        const errorMsg = error.response?.data?.error || (editingVehicle ? 'Yangilashda xatolik' : 'Qo\'shishda xatolik');
        message.error(errorMsg);
      }
    }
  };

  // Tahrirlash
  const handleEdit = (record) => {
    setEditingVehicle(record);
    setSelectedFuelType(record.fuel_type || 'diesel');
    
    // Super admin uchun korxona va tumanlarni yuklash
    if (user?.role?.name === 'super_admin' && record.company_id) {
      setSelectedCompany(record.company_id);
      fetchDistricts(record.company_id);
    }
    
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  // O'chirish
  const handleDelete = async (id) => {
    try {
      await api.delete(`/technics/${id}`);
      message.success('Texnika muvaffaqiyatli o\'chirildi');
      fetchVehicles(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('O\'chirishda xatolik');
    }
  };

  // Excel import - yaxshilangan versiya
  const handleImport = async (file) => {
    // Fayl formatini tekshirish
    const allowedFormats = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedFormats.includes(fileExtension)) {
      message.error('Faqat Excel faylari (.xlsx, .xls) qabul qilinadi');
      return false;
    }
    
    // Fayl hajmini tekshirish (5MB)
    if (file.size > 5 * 1024 * 1024) {
      message.error('Fayl hajmi 5MB dan oshmasligi kerak');
      return false;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Super admin uchun korxona ID qo'shish
    if (user?.role?.name === 'super_admin' && selectedCompany) {
      formData.append('company_id', selectedCompany);
    }

    try {
      setLoading(true);
      const response = await api.post('/technics/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Batafsil natijalarni ko'rsatish
      const { results } = response.data;
      
      if (results.success > 0) {
        message.success(`Muvaffaqiyat: ${results.success} ta texnika qo'shildi`);
      }
      
      if (results.errors && results.errors.length > 0) {
        console.error('Import xatoliklari:', results.errors);
        message.warning(`${results.errors.length} ta qatorda xatolik bor. Konsolni tekshiring.`);
        
        // Birinchi 3 ta xatolikni ko'rsatish
        results.errors.slice(0, 3).forEach((error, index) => {
          setTimeout(() => {
            message.error(`Qator ${error.row}: ${error.error}`);
          }, (index + 1) * 1000);
        });
      }
      
      setImportModalVisible(false);
      fetchVehicles();
    } catch (error) {
      console.error('Import xatoligi:', error);
      const errorMsg = error.response?.data?.error || 'Import qilishda xatolik yuz berdi';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
    
    return false; // Upload componentni fayl yuklashdan to'xtatish
  };

  // Filter o'zgartirish
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="vehicles-page">
      <div className="page-header">
        <Title level={2}>
          <CarOutlined /> Texnikalar
        </Title>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingVehicle(null);
              setSelectedFuelType('diesel');
              setSelectedCompany(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            Yangi texnika
          </Button>
          <Button
            icon={<UploadOutlined />}
            onClick={() => setImportModalVisible(true)}
          >
            Excel import
          </Button>
        </Space>
      </div>


      {/* Filterlar */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Input
              placeholder="Qidirish..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Turi"
              allowClear
              value={filters.vehicle_type}
              onChange={(value) => handleFilterChange('vehicle_type', value)}
              style={{ width: '100%' }}
            >
              {vehicleTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Yoqilg'i"
              allowClear
              value={filters.fuel_type}
              onChange={(value) => handleFilterChange('fuel_type', value)}
              style={{ width: '100%' }}
            >
              {fuelTypes.map(fuel => (
                <Option key={fuel.value} value={fuel.value}>
                  {fuel.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Holati"
              allowClear
              value={filters.is_active}
              onChange={(value) => handleFilterChange('is_active', value)}
              style={{ width: '100%' }}
            >
              <Option value="true">Faol</Option>
              <Option value="false">Faol emas</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Jadval */}
      <Card>
        <Table
          columns={columns}
          dataSource={vehicles}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} / ${total} ta texnika`
          }}
          onChange={(pag) => {
            fetchVehicles(pag.current, pag.pageSize);
          }}
        />
      </Card>

      {/* Texnika qo'shish/tahrirlash modal */}
      <Modal
        title={editingVehicle ? 'Texnikani tahrirlash' : 'Yangi texnika qo\'shish'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingVehicle(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {/* Korxona va Tuman tanlash */}
          {user?.role?.name === 'super_admin' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="company_id"
                  label="Korxona"
                  rules={[{ required: true, message: 'Korxona talab qilinadi' }]}
                >
                  <Select
                    placeholder="Korxonani tanlang"
                    onChange={(value) => {
                      setSelectedCompany(value);
                      form.setFieldValue('district_id', undefined);
                      fetchDistricts(value);
                    }}
                  >
                    {companies.map(company => (
                      <Option key={company.id} value={company.id}>
                        {company.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="district_id"
                  label="Tuman"
                  rules={[{ required: true, message: 'Tuman talab qilinadi' }]}
                >
                  <Select
                    placeholder="Tumanni tanlang"
                    disabled={!globalSelectedCompany && user?.role?.name === 'super_admin'}
                  >
                    {districts.map(district => (
                      <Option key={district.id} value={district.id}>
                        {district.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* Oddiy foydalanuvchi uchun faqat tuman */}
          {user?.role?.name !== 'super_admin' && (
            <Form.Item
              name="district_id"
              label="Tuman"
              rules={[{ required: true, message: 'Tuman talab qilinadi' }]}
            >
              <Select placeholder="Tumanni tanlang">
                {districts.map(district => (
                  <Option key={district.id} value={district.id}>
                    {district.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="plate_number"
                label="Davlat raqami"
                rules={[{ required: true, message: 'Davlat raqami talab qilinadi' }]}
              >
                <Input placeholder="01038SMA yoki 01S038MA" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="vehicle_type"
                label="Texnika turi"
                rules={[{ required: true, message: 'Texnika turi talab qilinadi' }]}
              >
                <Select placeholder="Texnika turini tanlang">
                  {vehicleTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="brand"
                label="Marka"
                rules={[{ required: true, message: 'Marka talab qilinadi' }]}
              >
                <Input placeholder="Mercedes, MAN, ..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="model"
                label="Model"
                rules={[{ required: true, message: 'Model talab qilinadi' }]}
              >
                <Input placeholder="Actros, TGS, ..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="year" label="Ishlab chiqarilgan yili">
                <InputNumber 
                  style={{ width: '100%' }}
                  min={1950} 
                  max={new Date().getFullYear() + 1}
                  placeholder="2020"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="capacity_m3" label="Sig'imi (m³)">
                <InputNumber 
                  style={{ width: '100%' }}
                  min={0.1}
                  max={100}
                  step={0.1}
                  placeholder="10.5"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="fuel_type" label="Yoqilg'i turi">
                <Select 
                  placeholder="Yoqilg'i turini tanlang"
                  onChange={(value) => setSelectedFuelType(value)}
                >
                  {fuelTypes.map(fuel => (
                    <Option key={fuel.value} value={fuel.value}>
                      {fuel.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="technical_passport_number"
            label="Texnik pasport raqami"
          >
            <Input placeholder="TP123456789" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item 
                name="fuel_tank_volume" 
                label={`Yoqilg'i baki xajimi (${selectedFuelType === 'gas' ? 'm³' : selectedFuelType === 'electric' ? 'kWh' : 'litr'})`}
                rules={[
                  {
                    type: 'number',
                    min: selectedFuelType === 'gas' ? 1 : selectedFuelType === 'electric' ? 10 : 10,
                    max: selectedFuelType === 'gas' ? 100 : selectedFuelType === 'electric' ? 200 : 1000,
                    message: `${selectedFuelType === 'gas' ? '1-100 m³' : selectedFuelType === 'electric' ? '10-200 kWh' : '10-1000 litr'} oralig'ida bo'lishi kerak`
                  }
                ]}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  min={selectedFuelType === 'gas' ? 1 : selectedFuelType === 'electric' ? 10 : 10}
                  max={selectedFuelType === 'gas' ? 100 : selectedFuelType === 'electric' ? 200 : 1000}
                  step={selectedFuelType === 'gas' ? 0.1 : selectedFuelType === 'electric' ? 1 : 1}
                  placeholder={selectedFuelType === 'gas' ? '50' : selectedFuelType === 'electric' ? '75' : '200'}
                  addonAfter={selectedFuelType === 'gas' ? 'm³' : selectedFuelType === 'electric' ? 'kWh' : 'L'}
                  disabled={selectedFuelType === 'electric'}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                name="fuel_consumption_per_100km" 
                label={`100km sarfi (${selectedFuelType === 'gas' ? 'm³' : selectedFuelType === 'electric' ? 'kWh' : 'litr'})`}
                rules={[
                  {
                    type: 'number',
                    min: selectedFuelType === 'gas' ? 0.1 : selectedFuelType === 'electric' ? 5 : 1,
                    max: selectedFuelType === 'gas' ? 50 : selectedFuelType === 'electric' ? 100 : 100,
                    message: `${selectedFuelType === 'gas' ? '0.1-50 m³' : selectedFuelType === 'electric' ? '5-100 kWh' : '1-100 litr'} oralig'ida bo'lishi kerak`
                  }
                ]}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  min={selectedFuelType === 'gas' ? 0.1 : selectedFuelType === 'electric' ? 5 : 1}
                  max={selectedFuelType === 'gas' ? 50 : selectedFuelType === 'electric' ? 100 : 100}
                  step={0.1}
                  placeholder={selectedFuelType === 'gas' ? '12.5' : selectedFuelType === 'electric' ? '15.0' : '25.5'}
                  addonAfter={selectedFuelType === 'gas' ? 'm³' : selectedFuelType === 'electric' ? 'kWh' : 'L'}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                name="trip_consumption" 
                label={`Qatnov sarfi (${selectedFuelType === 'gas' ? 'm³' : selectedFuelType === 'electric' ? 'kWh' : 'litr'})`}
                rules={[
                  {
                    type: 'number',
                    min: 0.1,
                    max: selectedFuelType === 'gas' ? 20 : selectedFuelType === 'electric' ? 30 : 50,
                    message: `${selectedFuelType === 'gas' ? '0.1-20 m³' : selectedFuelType === 'electric' ? '0.1-30 kWh' : '0.1-50 litr'} oralig'ida bo'lishi kerak`
                  }
                ]}
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  min={0.1}
                  max={selectedFuelType === 'gas' ? 20 : selectedFuelType === 'electric' ? 30 : 50}
                  step={0.1}
                  placeholder={selectedFuelType === 'gas' ? '2.5' : selectedFuelType === 'electric' ? '3.0' : '5.0'}
                  addonAfter={selectedFuelType === 'gas' ? 'm³' : selectedFuelType === 'electric' ? 'kWh' : 'L'}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingVehicle ? 'Yangilash' : 'Qo\'shish'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingVehicle(null);
                form.resetFields();
              }}>
                Bekor qilish
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Excel import modal */}
      <Modal
        title="Excel orqali texnikalar import qilish"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
      >
        {/* Super admin uchun korxona tanlash */}
        {user?.role?.name === 'super_admin' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Korxonani tanlang:</label>
            <Select
              placeholder="Import qilinadigan korxonani tanlang"
              style={{ width: '100%' }}
              value={selectedCompany}
              onChange={setSelectedCompany}
            >
              {companies.map(company => (
                <Option key={company.id} value={company.id}>
                  {company.name}
                </Option>
              ))}
            </Select>
          </div>
        )}
        
        <Upload
          accept=".xlsx,.xls"
          beforeUpload={handleImport}
          showUploadList={false}
          disabled={user?.role?.name === 'super_admin' && !selectedCompany}
        >
          <Button 
            icon={<UploadOutlined />} 
            size="large" 
            block 
            type="primary"
            loading={loading}
            disabled={user?.role?.name === 'super_admin' && !selectedCompany}
          >
            {loading ? 'Import qilinmoqda...' : 'Excel fayl tanlang'}
          </Button>
        </Upload>
        
        {user?.role?.name === 'super_admin' && !selectedCompany && (
          <p style={{ color: '#ff4d4f', textAlign: 'center', marginTop: 8 }}>
            Avval korxonani tanlang
          </p>
        )}
        
        <div style={{ marginTop: 16, padding: 20, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8 }}>
          <Title level={5} style={{ color: '#389e0d', marginBottom: 12 }}>📋 Excel fayl formati:</Title>
          
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontWeight: 'bold', color: '#52c41a', marginBottom: 8 }}>Majburiy ustunlar:</p>
            <ul style={{ marginLeft: 16, color: '#389e0d' }}>
              <li><strong>Davlat raqami</strong> - O'zbekiston texnika raqami (masalan: 01038SMA yoki 01S038MA)</li>
              <li><strong>Marka</strong> - Texnika markasi (masalan: Mercedes, KAMAZ)</li>
              <li><strong>Model</strong> - Texnika modeli (masalan: Actros, 65115)</li>
            </ul>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontWeight: 'bold', color: '#1890ff', marginBottom: 8 }}>Ixtiyoriy ustunlar:</p>
            <ul style={{ marginLeft: 16, color: '#666' }}>
              <li>Texnika turi (chiqindi_mashinasi, konteyner_mashinasi, pressa_mashinasi, pikap, boshqa)</li>
              <li>Yil (1950-{new Date().getFullYear() + 1})</li>
              <li>Sig'im (m3) - 0.1 dan 100 gacha</li>
              <li>Yoqilg'i turi (dizel, benzin, gaz, elektr, gibrid)</li>
              <li>Texnik pasport raqami</li>
              <li>Yoqilg'i baki xajimi (litr)</li>
              <li>100km sarfi (litr)</li>
              <li>Qatnov sarfi (litr)</li>
            </ul>
          </div>
          
          <div style={{ background: '#fff2e8', padding: 12, borderRadius: 6, border: '1px solid #ffbb96' }}>
            <p style={{ margin: 0, color: '#d46b08' }}>
              <strong>⚠️ Eslatma:</strong> Excel faylida birinchi qator sarlavha bo'lishi kerak. 
              Fayl hajmi 5MB dan oshmasligi kerak.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Vehicles;