import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Avatar,
  Input,
  Select,
  Modal,
  Form,
  message,
  Tooltip,
  Popconfirm,
  Typography,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  UserOutlined,
  TruckOutlined,
  CarOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  PhoneOutlined,
  IdcardOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import moment from 'moment';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { companiesAPI, districtsAPI } from '../../services/api';
import { create } from 'zustand';
import './EmployeeList.css';

// Company/District selector uchun store (import qilib bo'lmasa yaratamiz)
const useCompanySelectorStore = create((set, get) => ({
  selectedCompany: JSON.parse(localStorage.getItem('selectedCompany')) || null,
  selectedDistrict: JSON.parse(localStorage.getItem('selectedDistrict')) || null,
  companies: [],
  districts: [],
  loading: false,
  
  setSelectedCompany: (company) => {
    set({ selectedCompany: company, selectedDistrict: null });
    localStorage.setItem('selectedCompany', JSON.stringify(company));
    localStorage.removeItem('selectedDistrict');
  },
  
  setSelectedDistrict: (district) => {
    set({ selectedDistrict: district });
    localStorage.setItem('selectedDistrict', JSON.stringify(district));
  },
  
  setCompanies: (companies) => set({ companies }),
  setDistricts: (districts) => set({ districts }),
  setLoading: (loading) => set({ loading }),
  
  restoreFromStorage: () => {
    const savedCompany = localStorage.getItem('selectedCompany');
    const savedDistrict = localStorage.getItem('selectedDistrict');
    
    if (savedCompany) {
      set({ selectedCompany: JSON.parse(savedCompany) });
    }
    if (savedDistrict) {
      set({ selectedDistrict: JSON.parse(savedDistrict) });
    }
  }
}));

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const EmployeeList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [districts, setDistricts] = useState([]);
  
  // Filters
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form] = Form.useForm();
  
  const { user } = useAuthStore();
  const { selectedCompany, selectedDistrict } = useCompanySelectorStore();

  useEffect(() => {
    loadEmployees();
    loadVehicles();
    loadCompanies();
  }, [user, selectedCompany, selectedDistrict]);

  useEffect(() => {
    applyFilters();
  }, [searchText, categoryFilter, statusFilter, districtFilter, employees]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      
      const params = {
        company_id: selectedCompany?.id || user.company_id,
        district_id: selectedDistrict?.id || user.district_id,
        limit: 100,
        is_active: true
      };
      
      const response = await api.get('/employees', { params });
      const employeesData = response.data.data || [];
      
      // Process employee data from API
      const processedEmployees = employeesData.map(emp => ({
        ...emp,
        position_name: emp.position === 'driver' ? 'Haydovchi' : 'Yuk ortuvchi',
        vehicle_number: emp.vehicle?.plate_number || null,
        district_name: emp.district?.name || 'Belgilanmagan',
        company_name: emp.company?.name || 'Belgilanmagan',
        status: emp.is_active ? 'active' : 'inactive'
      }));
      
      setEmployees(processedEmployees);
      
    } catch (error) {
      console.error('Error loading employees:', error);
      message.error('Xodimlar ro\'yxatini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      const response = await api.get('/technics', {
        params: { limit: 100, is_active: true }
      });
      setVehicles(response.data.vehicles || response.data || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await companiesAPI.getAll({ limit: 100 });
      setCompanies(response.data.companies || response.data.data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const loadDistricts = async (companyId) => {
    try {
      const response = await districtsAPI.getAll({ 
        limit: 100,
        company_id: companyId
      });
      setDistricts(response.data.districts || response.data.data || []);
    } catch (error) {
      console.error('Error loading districts:', error);
      setDistricts([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...employees];

    // Search filter
    if (searchText) {
      filtered = filtered.filter(emp => 
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchText.toLowerCase()) ||
        emp.phone?.includes(searchText) ||
        emp.passport?.includes(searchText) ||
        emp.vehicle_number?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'drivers') {
        filtered = filtered.filter(emp => emp.position === 'driver');
      } else if (categoryFilter === 'loaders') {
        filtered = filtered.filter(emp => emp.position === 'loader');
      }
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(emp => emp.status === statusFilter);
    }

    setFilteredEmployees(filtered);
  };

  const handleEdit = (record) => {
    setEditingEmployee(record);
    form.setFieldsValue({
      first_name: record.first_name,
      last_name: record.last_name,
      phone: record.phone,
      position: record.position,
      vehicle_id: record.vehicle_id,
      passport: record.passport,
      company_id: record.company_id,
      district_id: record.district_id,
      status: record.status
    });
    
    // Load districts for the selected company
    if (record.company_id) {
      loadDistricts(record.company_id);
    }
    
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/employees/${id}`);
      message.success('Xodim o\'chirildi');
      loadEmployees();
    } catch (error) {
      console.error('Delete error:', error);
      message.error('O\'chirishda xatolik');
    }
  };

  const handleSave = async (values) => {
    try {
      setLoading(true);
      
      console.log('📤 Employee save qilinmoqda:');
      console.log('  Form values:', JSON.stringify(values, null, 2));
      console.log('  Editing mode:', !!editingEmployee);
      
      if (editingEmployee) {
        // Update existing employee
        console.log('  Updating employee ID:', editingEmployee.id);
        const response = await api.put(`/employees/${editingEmployee.id}`, values);
        console.log('  Update response:', response.data);
        message.success('Xodim ma\'lumotlari yangilandi');
      } else {
        // Create new employee
        console.log('  Creating new employee...');
        const response = await api.post('/employees', values);
        console.log('  Create response:', response.data);
        message.success('Yangi xodim qo\'shildi');
      }
      
      setModalVisible(false);
      form.resetFields();
      setEditingEmployee(null);
      loadEmployees();
      
    } catch (error) {
      console.error('❌ Save error:', error);
      console.error('  Error response:', error.response?.data);
      console.error('  Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Saqlashda noma\'lum xatolik';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPositionColor = (position) => {
    return position === 'driver' ? 'blue' : 'green';
  };

  const getPositionIcon = (position) => {
    return position === 'driver' ? <UserOutlined /> : <TruckOutlined />;
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'green' : 'red';
  };

  const columns = [
    {
      title: 'Xodim',
      key: 'employee',
      fixed: 'left',
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar 
            icon={getPositionIcon(record.position)}
            style={{ 
              backgroundColor: getPositionColor(record.position) === 'blue' ? '#1890ff' : '#52c41a' 
            }}
          />
          <div>
            <Text strong>{record.first_name} {record.last_name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.position_name}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Aloqa',
      key: 'contact',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space size="small">
            <PhoneOutlined style={{ color: '#1890ff' }} />
            <Text>{record.phone}</Text>
          </Space>
          <Space size="small">
            <IdcardOutlined style={{ color: '#52c41a' }} />
            <Text>{record.passport}</Text>
          </Space>
        </Space>
      )
    },
    {
      title: 'Biriktirilgan texnika',
      key: 'vehicle',
      width: 150,
      render: (_, record) => (
        record.vehicle_number ? (
          <Space>
            <CarOutlined style={{ color: '#1890ff' }} />
            <Text>{record.vehicle_number}</Text>
          </Space>
        ) : (
          <Text type="secondary">Biriktirilmagan</Text>
        )
      )
    },
    {
      title: 'Lavozim',
      dataIndex: 'position',
      key: 'position',
      width: 120,
      render: (position, record) => (
        <Tag color={getPositionColor(position)} icon={getPositionIcon(position)}>
          {record.position_name}
        </Tag>
      )
    },
    {
      title: 'Holat',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status === 'active' ? 'Faol' : 'Faol emas'}
        </Tag>
      )
    },
    {
      title: 'Ish boshlagan sana',
      dataIndex: 'hire_date',
      key: 'hire_date',
      width: 120,
      render: (date) => (
        <Space size="small">
          <CalendarOutlined style={{ color: '#fa8c16' }} />
          <Text>{moment(date).format('DD.MM.YYYY')}</Text>
        </Space>
      )
    },
    {
      title: 'Amallar',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Tahrirlash">
            <Button 
              type="primary" 
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Tabel">
            <Button 
              size="small"
              icon={<CalendarOutlined />}
              onClick={() => navigate(`/employees/tabel/${record.id}`)}
            />
          </Tooltip>
          <Popconfirm
            title="Xodimni o'chirishni xohlaysizmi?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ha"
            cancelText="Yo'q"
          >
            <Tooltip title="O'chirish">
              <Button 
                danger 
                size="small"
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const driversCount = filteredEmployees.filter(emp => emp.position === 'driver').length;
  const loadersCount = filteredEmployees.filter(emp => emp.position === 'loader').length;
  const activeCount = filteredEmployees.filter(emp => emp.status === 'active').length;
  const assignedCount = filteredEmployees.filter(emp => emp.vehicle_id).length;

  return (
    <div className="employee-list">
      <Card className="header-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
              <UserOutlined /> Xodimlar ro'yxati
            </Title>
            <Text type="secondary">
              Haydovchilar va yuk ortuvchilar boshqaruvi
            </Text>
          </div>
          
                      <Button 
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingEmployee(null);
                form.resetFields();
                
                // Global filtrlardan default qiymatlarni olish
                if (selectedCompany) {
                  form.setFieldsValue({
                    company_id: selectedCompany.id,
                    district_id: selectedDistrict?.id
                  });
                  loadDistricts(selectedCompany.id);
                }
                
                setModalVisible(true);
              }}
            >
              Yangi xodim
            </Button>
        </div>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic title="Jami xodimlar" value={filteredEmployees.length} />
          </Col>
          <Col span={6}>
            <Statistic title="Haydovchilar" value={driversCount} valueStyle={{ color: '#1890ff' }} />
          </Col>
          <Col span={6}>
            <Statistic title="Yuk ortuvchilar" value={loadersCount} valueStyle={{ color: '#52c41a' }} />
          </Col>
          <Col span={6}>
            <Statistic title="Texnika biriktirilgan" value={assignedCount} valueStyle={{ color: '#fa8c16' }} />
          </Col>
        </Row>

        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Search
              placeholder="Xodim, telefon, passport yoki texnika bo'yicha qidirish..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: '100%' }}
              placeholder="Kategoriya"
            >
              <Option value="all">Barcha kategoriya</Option>
              <Option value="drivers">Haydovchilar</Option>
              <Option value="loaders">Yuk ortuvchilar</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              placeholder="Holat"
            >
              <Option value="all">Barcha holat</Option>
              <Option value="active">Faol</Option>
              <Option value="inactive">Faol emas</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredEmployees}
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} / ${total} xodim`
          }}
          scroll={{ x: 1200 }}
          size="small"
          rowKey="id"
        />
      </Card>

      {/* Edit/Add Modal */}
      <Modal
        title={editingEmployee ? 'Xodimni tahrirlash' : 'Yangi xodim qo\'shish'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingEmployee(null);
        }}
        onOk={form.submit}
        width={600}
        loading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="Ism" 
                name="first_name"
                rules={[{ required: true, message: 'Ism majburiy!' }]}
              >
                <Input placeholder="Ismni kiriting" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="Familiya" 
                name="last_name"
                rules={[{ required: true, message: 'Familiya majburiy!' }]}
              >
                <Input placeholder="Familiyani kiriting" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="Telefon" 
                name="phone"
                rules={[{ required: true, message: 'Telefon majburiy!' }]}
              >
                <Input placeholder="+998901234567" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="Passport" 
                name="passport"
                rules={[{ required: true, message: 'Passport majburiy!' }]}
              >
                <Input placeholder="AC1234567" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="Korxona" 
                name="company_id"
                rules={[{ required: true, message: 'Korxona majburiy!' }]}
              >
                <Select 
                  placeholder="Korxonani tanlang"
                  showSearch
                  optionFilterProp="children"
                  onChange={(value) => {
                    loadDistricts(value);
                    form.setFieldsValue({ district_id: undefined });
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
                label="Tuman" 
                name="district_id"
              >
                <Select 
                  placeholder="Tumanni tanlang"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  disabled={districts.length === 0}
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
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="Lavozim" 
                name="position"
                rules={[{ required: true, message: 'Lavozim majburiy!' }]}
              >
                <Select placeholder="Lavozimni tanlang">
                  <Option value="driver">Haydovchi</Option>
                  <Option value="loader">Yuk ortuvchi</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="Biriktirilgan texnika" 
                name="vehicle_id"
              >
                <Select 
                  placeholder="Texnikani tanlang"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {vehicles.map(vehicle => (
                    <Option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate_number} - {vehicle.brand} {vehicle.model}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item 
            label="Holat" 
            name="status"
            rules={[{ required: true, message: 'Holat majburiy!' }]}
          >
            <Select placeholder="Holatni tanlang">
              <Option value="active">Faol</Option>
              <Option value="inactive">Faol emas</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeList;
