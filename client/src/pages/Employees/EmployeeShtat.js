import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Typography, 
  Select,
  Button,
  Space,
  Tag,
  Statistic,
  Row,
  Col,
  Tree,
  Tabs,
  Avatar,
  Progress,
  message,
  Modal,
  Form,
  Input,
  InputNumber
} from 'antd';
import { 
  TeamOutlined,
  UserOutlined,
  TruckOutlined,
  BankOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  PrinterOutlined,
  UsergroupAddOutlined,
  ApartmentOutlined,
  ContactsOutlined
} from '@ant-design/icons';
import moment from 'moment';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import './EmployeeShtat.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const EmployeeShtat = () => {
  const [loading, setLoading] = useState(false);
  const [shtatData, setShtatData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [activeTab, setActiveTab] = useState('company');
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingShtat, setEditingShtat] = useState(null);
  const [form] = Form.useForm();
  
  const { user } = useAuthStore();

  useEffect(() => {
    loadShtatData();
    loadDepartments();
    loadPositions();
  }, [user]);

  const loadShtatData = async () => {
    try {
      setLoading(true);
      
      // Mock shtat data
      const mockShtatData = [
        {
          id: 1,
          department: 'Texnika bo\'limi',
          department_type: 'operational',
          position_name: 'Haydovchi',
          position_code: 'DRIVER',
          planned_count: 12,
          actual_count: 10,
          salary_min: 2500000,
          salary_max: 3500000,
          requirements: 'B toifali haydovchilik guvohnomasi, 3 yildan ortiq tajriba',
          district_name: 'Angren',
          company_name: 'ANGREN BUNYOD FAYZ',
          employees: [
            { id: 1, name: 'Karim Ahmedov', vehicle: '01A123BC', status: 'active' },
            { id: 3, name: 'Islom Ibrohimov', vehicle: '01B456DE', status: 'active' },
            { id: 5, name: 'Dilshod Rahmonov', vehicle: null, status: 'inactive' }
          ]
        },
        {
          id: 2,
          department: 'Texnika bo\'limi',
          department_type: 'operational',
          position_name: 'Yuk ortuvchi',
          position_code: 'LOADER',
          planned_count: 18,
          actual_count: 15,
          salary_min: 2000000,
          salary_max: 2800000,
          requirements: 'Jismoniy tayyorgarlik, 1 yildan ortiq tajriba',
          district_name: 'Angren',
          company_name: 'ANGREN BUNYOD FAYZ',
          employees: [
            { id: 2, name: 'Bobur Toshmatov', vehicle: '01A123BC', status: 'active' },
            { id: 4, name: 'Aziz Karimov', vehicle: '01B456DE', status: 'active' }
          ]
        },
        {
          id: 3,
          department: 'Boshqaruv apparati',
          department_type: 'aup',
          position_name: 'Texnika bo\'limi boshlig\'i',
          position_code: 'TECH_HEAD',
          planned_count: 1,
          actual_count: 1,
          salary_min: 4000000,
          salary_max: 5500000,
          requirements: 'Oliy texnik ta\'lim, 5 yildan ortiq boshqaruv tajribasi',
          district_name: 'Angren',
          company_name: 'ANGREN BUNYOD FAYZ',
          employees: [
            { id: 6, name: 'Rustam Umarov', vehicle: null, status: 'active' }
          ]
        },
        {
          id: 4,
          department: 'Boshqaruv apparati',
          department_type: 'aup',
          position_name: 'Operator',
          position_code: 'OPERATOR',
          planned_count: 3,
          actual_count: 2,
          salary_min: 3000000,
          salary_max: 4000000,
          requirements: 'Kompyuter savati, 1 yildan ortiq tajriba',
          district_name: 'Angren',
          company_name: 'ANGREN BUNYOD FAYZ',
          employees: [
            { id: 7, name: 'Gulnora Karimova', vehicle: null, status: 'active' },
            { id: 8, name: 'Shohrux Tursunov', vehicle: null, status: 'active' }
          ]
        }
      ];
      
      setShtatData(mockShtatData);
      
    } catch (error) {
      console.error('Error loading shtat data:', error);
      message.error('Shtat ma\'lumotlarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const mockDepartments = [
        { id: 1, name: 'Texnika bo\'limi', type: 'operational', parent_id: null },
        { id: 2, name: 'Boshqaruv apparati', type: 'aup', parent_id: null },
        { id: 3, name: 'Moliya bo\'limi', type: 'aup', parent_id: null }
      ];
      setDepartments(mockDepartments);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadPositions = async () => {
    try {
      const mockPositions = [
        { id: 1, name: 'Haydovchi', code: 'DRIVER', category: 'driver' },
        { id: 2, name: 'Yuk ortuvchi', code: 'LOADER', category: 'loader' },
        { id: 3, name: 'Texnika bo\'limi boshlig\'i', code: 'TECH_HEAD', category: 'management' },
        { id: 4, name: 'Operator', code: 'OPERATOR', category: 'office' }
      ];
      setPositions(mockPositions);
    } catch (error) {
      console.error('Error loading positions:', error);
    }
  };

  const getCompletionRate = (actual, planned) => {
    return planned > 0 ? Math.round((actual / planned) * 100) : 0;
  };

  const getDepartmentTypeColor = (type) => {
    return type === 'operational' ? 'blue' : 'purple';
  };

  const getDepartmentTypeText = (type) => {
    return type === 'operational' ? 'Ishlab chiqarish' : 'AUP';
  };

  const getStatusColor = (actual, planned) => {
    const rate = getCompletionRate(actual, planned);
    if (rate >= 100) return '#52c41a';
    if (rate >= 80) return '#faad14';
    return '#ff4d4f';
  };

  const handleEdit = (record) => {
    setEditingShtat(record);
    form.setFieldsValue({
      department: record.department,
      position_name: record.position_name,
      position_code: record.position_code,
      planned_count: record.planned_count,
      salary_min: record.salary_min,
      salary_max: record.salary_max,
      requirements: record.requirements
    });
    setModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      setLoading(true);
      
      if (editingShtat) {
        // Update existing
        message.success('Shtat birligi yangilandi');
      } else {
        // Create new
        message.success('Yangi shtat birligi qo\'shildi');
      }
      
      setModalVisible(false);
      form.resetFields();
      setEditingShtat(null);
      loadShtatData();
      
    } catch (error) {
      console.error('Save error:', error);
      message.error('Saqlashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const companyColumns = [
    {
      title: 'Bo\'lim',
      key: 'department',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            <BankOutlined style={{ color: getDepartmentTypeColor(record.department_type) }} />
            <Text strong>{record.department}</Text>
          </Space>
          <Tag color={getDepartmentTypeColor(record.department_type)}>
            {getDepartmentTypeText(record.department_type)}
          </Tag>
        </Space>
      )
    },
    {
      title: 'Lavozim',
      key: 'position',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.position_name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Kod: {record.position_code}
          </Text>
        </Space>
      )
    },
    {
      title: 'Shtat',
      key: 'count',
      width: 120,
      render: (_, record) => {
        const rate = getCompletionRate(record.actual_count, record.planned_count);
        return (
          <Space direction="vertical" size="small" style={{ textAlign: 'center' }}>
            <Text>
              <Text strong style={{ color: getStatusColor(record.actual_count, record.planned_count) }}>
                {record.actual_count}
              </Text>
              <Text type="secondary"> / {record.planned_count}</Text>
            </Text>
            <Progress 
              percent={rate} 
              size="small" 
              strokeColor={getStatusColor(record.actual_count, record.planned_count)}
              showInfo={false}
            />
            <Text style={{ fontSize: 10 }}>{rate}%</Text>
          </Space>
        );
      }
    },
    {
      title: 'Maosh (so\'m)',
      key: 'salary',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text style={{ fontSize: 12 }}>
            Min: {record.salary_min?.toLocaleString() || 'N/A'}
          </Text>
          <Text style={{ fontSize: 12 }}>
            Max: {record.salary_max?.toLocaleString() || 'N/A'}
          </Text>
        </Space>
      )
    },
    {
      title: 'Xodimlar',
      key: 'employees',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.employees?.slice(0, 3).map(emp => (
            <Space key={emp.id} size="small">
              <Avatar 
                size="small" 
                icon={<UserOutlined />}
                style={{ backgroundColor: emp.status === 'active' ? '#52c41a' : '#ff4d4f' }}
              />
              <Text style={{ fontSize: 12 }}>{emp.name}</Text>
              {emp.vehicle && (
                <Tag size="small" color="blue">{emp.vehicle}</Tag>
              )}
            </Space>
          ))}
          {record.employees?.length > 3 && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              +{record.employees.length - 3} ko'proq...
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Talablar',
      dataIndex: 'requirements',
      key: 'requirements',
      width: 250,
      render: (text) => (
        <Text style={{ fontSize: 12 }} ellipsis={{ tooltip: text }}>
          {text}
        </Text>
      )
    },
    {
      title: 'Amallar',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button 
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button 
            size="small"
            danger
            icon={<DeleteOutlined />}
          />
        </Space>
      )
    }
  ];

  const districtColumns = [
    {
      title: 'Tuman/Shahar',
      key: 'district',
      render: (_, record) => (
        <Space>
          <EnvironmentOutlined style={{ color: '#1890ff' }} />
          <Text strong>{record.district_name}</Text>
        </Space>
      )
    },
    ...companyColumns.slice(1) // Remove department column for district view
  ];

  const filteredData = selectedDepartment === 'all' 
    ? shtatData 
    : shtatData.filter(item => item.department === selectedDepartment);

  // Calculate summary statistics
  const totalPlanned = filteredData.reduce((sum, item) => sum + item.planned_count, 0);
  const totalActual = filteredData.reduce((sum, item) => sum + item.actual_count, 0);
  const operationalCount = filteredData.filter(item => item.department_type === 'operational').reduce((sum, item) => sum + item.actual_count, 0);
  const aupCount = filteredData.filter(item => item.department_type === 'aup').reduce((sum, item) => sum + item.actual_count, 0);
  const avgCompletion = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;

  const tabItems = [
    {
      key: 'company',
      label: (
        <Space>
          <BankOutlined />
          Korxona bo'yicha
        </Space>
      ),
      children: (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Select
                value={selectedDepartment}
                onChange={setSelectedDepartment}
                style={{ width: '100%' }}
                placeholder="Bo'limni tanlang"
              >
                <Option value="all">Barcha bo'limlar</Option>
                {departments.map(dept => (
                  <Option key={dept.id} value={dept.name}>
                    {dept.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={16} style={{ textAlign: 'right' }}>
              <Space>
                <Button 
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingShtat(null);
                    form.resetFields();
                    setModalVisible(true);
                  }}
                >
                  Yangi shtat birligi
                </Button>
                <Button icon={<FileExcelOutlined />}>Excel export</Button>
                <Button icon={<PrinterOutlined />}>Chop etish</Button>
              </Space>
            </Col>
          </Row>

          <Table
            columns={companyColumns}
            dataSource={filteredData}
            loading={loading}
            pagination={false}
            scroll={{ x: 1300 }}
            size="small"
            rowKey="id"
            className="shtat-table"
          />
        </div>
      )
    },
    {
      key: 'district',
      label: (
        <Space>
          <EnvironmentOutlined />
          Tuman bo'yicha
        </Space>
      ),
      children: (
        <div>
          <Table
            columns={districtColumns}
            dataSource={filteredData}
            loading={loading}
            pagination={false}
            scroll={{ x: 1100 }}
            size="small"
            rowKey="id"
            className="shtat-table"
          />
        </div>
      )
    },
    {
      key: 'aup',
      label: (
        <Space>
          <ContactsOutlined />
          AUP xodimlari
        </Space>
      ),
      children: (
        <div>
          <Table
            columns={companyColumns}
            dataSource={filteredData.filter(item => item.department_type === 'aup')}
            loading={loading}
            pagination={false}
            scroll={{ x: 1300 }}
            size="small"
            rowKey="id"
            className="shtat-table"
          />
        </div>
      )
    }
  ];

  return (
    <div className="employee-shtat">
      <Card className="header-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
              <ApartmentOutlined /> Shtat jadvali
            </Title>
            <Text type="secondary">
              Xodimlar shtat birliklari va lavozimlar boshqaruvi
            </Text>
          </div>
        </div>

        {/* Summary Statistics */}
        <Row gutter={16}>
          <Col span={6}>
            <Statistic 
              title="Jami shtat" 
              value={totalPlanned} 
              valueStyle={{ color: '#1890ff' }}
              prefix={<TeamOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Haqiqiy son" 
              value={totalActual} 
              valueStyle={{ color: '#52c41a' }}
              prefix={<UserOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Ishlab chiqarish" 
              value={operationalCount} 
              valueStyle={{ color: '#fa8c16' }}
              prefix={<TruckOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="To'ldirilganlik" 
              value={avgCompletion} 
              suffix="%" 
              valueStyle={{ color: getStatusColor(totalActual, totalPlanned) }}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          tabBarStyle={{ borderBottom: '1px solid #f0f0f0' }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingShtat ? 'Shtat birligini tahrirlash' : 'Yangi shtat birligi'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingShtat(null);
        }}
        onOk={form.submit}
        width={800}
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
                label="Bo'lim" 
                name="department"
                rules={[{ required: true, message: 'Bo\'lim majburiy!' }]}
              >
                <Select placeholder="Bo'limni tanlang">
                  {departments.map(dept => (
                    <Option key={dept.id} value={dept.name}>
                      {dept.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="Lavozim nomi" 
                name="position_name"
                rules={[{ required: true, message: 'Lavozim majburiy!' }]}
              >
                <Input placeholder="Lavozim nomini kiriting" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item 
                label="Lavozim kodi" 
                name="position_code"
                rules={[{ required: true, message: 'Kod majburiy!' }]}
              >
                <Input placeholder="DRIVER" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                label="Shtat soni" 
                name="planned_count"
                rules={[{ required: true, message: 'Shtat soni majburiy!' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="1" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="Minimal maosh (so'm)" 
                name="salary_min"
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }} 
                  placeholder="2500000"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="Maksimal maosh (so'm)" 
                name="salary_max"
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }} 
                  placeholder="3500000"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            label="Talablar" 
            name="requirements"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Lavozimga qo'yiladigan talablar..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeShtat;
