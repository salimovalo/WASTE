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
  Tag,
  Row,
  Col,
  Statistic,
  Divider,
  Switch
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined,
  ShopOutlined,
  ThunderboltOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const FuelStations = () => {

  const [loading, setLoading] = useState(false);
  const [fuelStations, setFuelStations] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [districts, setDistricts] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    fuel_type: '',
    is_active: ''
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [form] = Form.useForm();

  // Yoqilg'i turlari
  const fuelTypes = [
    { value: 'gas', label: 'Gaz' },
    { value: 'diesel', label: 'Dizel' },
    { value: 'gasoline', label: 'Benzin' }
  ];

  // Ma'lumotlarni yuklash
  const fetchFuelStations = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        ...filters
      };

      const response = await api.get('/fuel-stations', { params });
      setFuelStations(response.data.fuel_stations);
      setPagination({
        current: page,
        pageSize,
        total: response.data.pagination.total_items
      });
    } catch (error) {
      message.error('Zapravkalar ro\'yxatini yuklashda xatolik');
      console.error('Error fetching fuel stations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Statistikani yuklash
  const fetchStatistics = async () => {
    try {
      const response = await api.get('/fuel-stations/stats/summary');
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Tumanlarni yuklash
  const fetchDistricts = async () => {
    try {
      const response = await api.get('/districts', {
        params: { limit: 1000 }
      });
      setDistricts(response.data.districts || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  useEffect(() => {
    fetchFuelStations();
    fetchStatistics();
    fetchDistricts();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Jadval ustunlari
  const columns = [
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
        const fuelObj = fuelTypes.find(f => f.value === fuel);
        const color = fuel === 'gas' ? 'green' : fuel === 'diesel' ? 'orange' : 'blue';
        return <Tag color={color}>{fuelObj ? fuelObj.label : fuel}</Tag>;
      }
    },
    {
      title: 'Narx (1L)',
      dataIndex: 'fuel_price_per_liter',
      key: 'fuel_price_per_liter',
      render: (price) => `${Number(price).toLocaleString()} so'm`
    },
    {
      title: 'Sig\'im',
      dataIndex: 'capacity_liters',
      key: 'capacity_liters',
      render: (capacity) => capacity ? `${capacity.toLocaleString()} L` : '-'
    },
    {
      title: 'Qoldiq',
      dataIndex: 'current_stock',
      key: 'current_stock',
      render: (stock) => stock ? `${Number(stock).toLocaleString()} L` : '0 L'
    },
    {
      title: 'Tumanlar',
      dataIndex: 'districts',
      key: 'districts',
      render: (districts) => (
        <div>
          {districts?.map(district => (
            <Tag key={district.id} size="small">
              {district.name}
            </Tag>
          ))}
        </div>
      )
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
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record.id)}
            size="small"
          >
            O'chirish
          </Button>
        </Space>
      )
    }
  ];

  // Yangi zapravka qo'shish/tahrirlash
  const handleSubmit = async (values) => {
    try {
      if (editingStation) {
        await api.put(`/fuel-stations/${editingStation.id}`, values);
        message.success('Zapravka muvaffaqiyatli yangilandi');
      } else {
        await api.post('/fuel-stations', values);
        message.success('Zapravka muvaffaqiyatli qo\'shildi');
      }
      
      setModalVisible(false);
      setEditingStation(null);
      form.resetFields();
      fetchFuelStations(pagination.current, pagination.pageSize);
      fetchStatistics();
    } catch (error) {
      message.error(editingStation ? 'Yangilashda xatolik' : 'Qo\'shishda xatolik');
    }
  };

  // Tahrirlash
  const handleEdit = (record) => {
    setEditingStation(record);
    form.setFieldsValue({
      ...record,
      district_ids: record.districts?.map(d => d.id) || []
    });
    setModalVisible(true);
  };

  // O'chirish
  const handleDelete = async (id) => {
    try {
      await api.delete(`/fuel-stations/${id}`);
      message.success('Zapravka muvaffaqiyatli o\'chirildi');
      fetchFuelStations(pagination.current, pagination.pageSize);
      fetchStatistics();
    } catch (error) {
      message.error('O\'chirishda xatolik');
    }
  };

  // Filter o'zgartirish
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="fuel-stations-page" style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24,
        padding: '16px 24px',
        background: 'white',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)'
      }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShopOutlined /> Zapravkalar
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingStation(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          Yangi zapravka
        </Button>
      </div>

      {/* Statistika */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Jami zapravkalar"
              value={statistics.totalStations || 0}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Faol zapravkalar"
              value={statistics.activeStations || 0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Jami sig'im"
              value={statistics.totalCapacity || 0}
              suffix="L"
              precision={0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Jami qoldiq"
              value={statistics.totalStock || 0}
              suffix="L"
              precision={1}
            />
          </Card>
        </Col>
      </Row>

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
              placeholder="Yoqilg'i turi"
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
          dataSource={fuelStations}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} / ${total} ta zapravka`
          }}
          onChange={(pag) => {
            fetchFuelStations(pag.current, pag.pageSize);
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Zapravka qo'shish/tahrirlash modal */}
      <Modal
        title={editingStation ? 'Zapravkani tahrirlash' : 'Yangi zapravka qo\'shish'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingStation(null);
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
                  {fuelTypes.map(fuel => (
                    <Option key={fuel.value} value={fuel.value}>
                      {fuel.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fuel_price_per_liter"
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
            <TextArea 
              rows={2}
              placeholder="Zapravka manzili"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Telefon raqami"
              >
                <Input placeholder="+998 90 123 45 67" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="manager_name"
                label="Menejer ismi"
              >
                <Input placeholder="Menejer ismi" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="capacity_liters"
                label="Sig'imi (litr)"
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  min={100}
                  placeholder="10000"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="current_stock"
                label="Hozirgi qoldiq (litr)"
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="5000"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="is_active"
                label="Faol"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="district_ids"
            label="Xizmat ko'rsatadigan tumanlar"
          >
            <Select
              mode="multiple"
              placeholder="Tumanlarni tanlang"
              style={{ width: '100%' }}
            >
              {districts.map(district => (
                <Option key={district.id} value={district.id}>
                  <EnvironmentOutlined style={{ marginRight: 4 }} />
                  {district.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider />
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingStation ? 'Yangilash' : 'Qo\'shish'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingStation(null);
                form.resetFields();
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

export default FuelStations;
