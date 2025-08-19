import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tag
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title } = Typography;
const { Option } = Select;

const Districts = () => {
  const [districts, setDistricts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [form] = Form.useForm();

  // Ma'lumotlarni yuklash
  const fetchDistricts = async (page = 1, search = '', company_id = null) => {
    try {
      setLoading(true);
      const response = await api.get('/districts', {
        params: {
          page,
          limit: pagination.pageSize,
          search,
          company_id
        }
      });
      
      setDistricts(response.data.districts);
      setPagination(prev => ({
        ...prev,
        current: response.data.pagination.current_page,
        total: response.data.pagination.total_items
      }));
    } catch (error) {
      message.error('Tumanlarni yuklashda xatolik yuz berdi');
      console.error('Districts fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Korxonalarni yuklash
  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(response.data.companies || []);
    } catch (error) {
      console.error('Companies fetch error:', error);
    }
  };

  useEffect(() => {
    fetchDistricts();
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Qidiruv
  const handleSearch = (value) => {
    setSearchText(value);
    fetchDistricts(1, value, selectedCompany);
  };

  // Korxona filtri
  const handleCompanyFilter = (companyId) => {
    setSelectedCompany(companyId);
    fetchDistricts(1, searchText, companyId);
  };

  // Jadval sahifalash
  const handleTableChange = (pagination) => {
    fetchDistricts(pagination.current, searchText, selectedCompany);
  };

  // Modal ochish/yopish
  const showModal = (district = null) => {
    setEditingDistrict(district);
    setModalVisible(true);
    
    if (district) {
      form.setFieldsValue({
        company_id: district.company?.id,
        name: district.name,
        code: district.code,
        region: district.region,
        population: district.population,
        area_km2: district.area_km2,
        tozamakon_id: district.tozamakon_id
      });
    } else {
      form.resetFields();
    }
  };

  const hideModal = () => {
    setModalVisible(false);
    setEditingDistrict(null);
    form.resetFields();
  };

  // Tuman saqlash
  const handleSave = async (values) => {
    try {
      if (editingDistrict) {
        await api.put(`/districts/${editingDistrict.id}`, values);
        message.success('Tuman muvaffaqiyatli yangilandi');
      } else {
        await api.post('/districts', values);
        message.success('Tuman muvaffaqiyatli qo\'shildi');
      }
      
      hideModal();
      fetchDistricts(pagination.current, searchText, selectedCompany);
    } catch (error) {
      message.error(editingDistrict ? 'Tumanni yangilashda xatolik' : 'Tuman qo\'shishda xatolik');
      console.error('Save district error:', error);
    }
  };

  // Tuman o'chirish
  const handleDelete = async (id) => {
    try {
      await api.delete(`/districts/${id}`);
      message.success('Tuman muvaffaqiyatli o\'chirildi');
      fetchDistricts(pagination.current, searchText, selectedCompany);
    } catch (error) {
      message.error('Tumanni o\'chirishda xatolik');
      console.error('Delete district error:', error);
    }
  };

  // Jadval ustunlari
  const columns = [
    {
      title: 'Nomi',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Kodi',
      dataIndex: 'code',
      key: 'code',
      width: 100,
    },
    {
      title: 'Korxona',
      dataIndex: ['company', 'name'],
      key: 'company',
      render: (text, record) => record.company?.name || '-',
    },
    {
      title: 'Viloyat/Shahar',
      dataIndex: 'region',
      key: 'region',
      render: (text) => text || '-',
    },
    {
      title: 'Tozamakon ID',
      dataIndex: 'tozamakon_id',
      key: 'tozamakon_id',
      render: (text) => text || '-',
    },
    {
      title: 'Aholi soni',
      dataIndex: 'population',
      key: 'population',
      render: (value) => value ? value.toLocaleString() : '-',
      width: 120,
    },
    {
      title: 'Maydon (km²)',
      dataIndex: 'area_km2',
      key: 'area_km2',
      render: (value) => value ? `${value} km²` : '-',
      width: 120,
    },
    {
      title: 'Holati',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Faol' : 'Nofaol'}
        </Tag>
      ),
      width: 80,
    },
    {
      title: 'Amallar',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          />
          <Popconfirm
            title="Tumanni o'chirishni tasdiqlaysizmi?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ha"
            cancelText="Yo'q"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="districts-page fade-in">
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card>
            <Title level={2}>Tumanlar boshqaruvi</Title>
            
            {/* Statistika */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Statistic
                  title="Jami tumanlar"
                  value={districts.length}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Faol tumanlar"
                  value={districts.filter(d => d.is_active).length}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Korxonalar"
                  value={companies.length}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>

            {/* Boshqaruv paneli */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col flex="auto">
                <Space size="middle">
                  <Input.Search
                    placeholder="Tuman nomi yoki kodi bo'yicha qidiring..."
                    allowClear
                    style={{ width: 300 }}
                    onSearch={handleSearch}
                  />
                  
                  <Select
                    placeholder="Korxona bo'yicha filtr"
                    allowClear
                    style={{ width: 200 }}
                    onChange={handleCompanyFilter}
                  >
                    {companies.map(company => (
                      <Option key={company.id} value={company.id}>
                        {company.name}
                      </Option>
                    ))}
                  </Select>
                  
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => fetchDistricts(pagination.current, searchText, selectedCompany)}
                  >
                    Yangilash
                  </Button>
                </Space>
              </Col>
              
              <Col>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => showModal()}
                >
                  Yangi tuman
                </Button>
              </Col>
            </Row>

            {/* Jadval */}
            <Table
              columns={columns}
              dataSource={districts}
              rowKey="id"
              loading={loading}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} / ${total} ta tuman`,
              }}
              onChange={handleTableChange}
              scroll={{ x: 1200 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tuman qo'shish/tahrirlash modali */}
      <Modal
        title={editingDistrict ? 'Tumanni tahrirlash' : 'Yangi tuman qo\'shish'}
        open={modalVisible}
        onCancel={hideModal}
        width={600}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="company_id"
                label="Korxona"
                rules={[{ required: true, message: 'Korxonani tanlang!' }]}
              >
                <Select
                  placeholder="Korxonani tanlang"
                  showSearch
                  optionFilterProp="children"
                >
                  {companies.map(company => (
                    <Option key={company.id} value={company.id}>
                      {company.name} ({company.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tuman nomi"
                rules={[
                  { required: true, message: 'Tuman nomini kiriting!' },
                  { min: 2, max: 255, message: 'Tuman nomi 2-255 ta belgi bo\'lishi kerak!' }
                ]}
              >
                <Input placeholder="Tuman nomini kiriting" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="code"
                label="Tuman kodi"
                rules={[
                  { required: true, message: 'Tuman kodini kiriting!' },
                  { min: 2, max: 10, message: 'Tuman kodi 2-10 ta belgi bo\'lishi kerak!' }
                ]}
              >
                <Input placeholder="Tuman kodini kiriting" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="region"
                label="Viloyat/Shahar"
              >
                <Input placeholder="Viloyat yoki shahar nomini kiriting" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="tozamakon_id"
                label="Tozamakon ID raqami"
                rules={[
                  { min: 3, max: 50, message: 'Tozamakon ID 3-50 ta belgi bo\'lishi kerak!' }
                ]}
              >
                <Input placeholder="Tozamakon ID raqamini kiriting" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="population"
                label="Aholi soni"
              >
                <Input
                  type="number"
                  placeholder="Aholi sonini kiriting"
                  min={0}
                />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="area_km2"
                label="Maydon (km²)"
              >
                <Input
                  type="number"
                  placeholder="Maydoni (km²)"
                  min={0}
                  step={0.01}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={hideModal}>
                Bekor qilish
              </Button>
              <Button type="primary" htmlType="submit">
                {editingDistrict ? 'Yangilash' : 'Qo\'shish'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Districts;
