import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Table,
  Button,
  message,
  Space,
  Modal,
  Form,
  Select,
  Input,
  Tag,
  Spin,
  Row,
  Col,
  Popconfirm
} from 'antd';
import { 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  RedoOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const WorkStatusReasons = () => {
  const [loading, setLoading] = useState(false);
  const [reasons, setReasons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReason, setEditingReason] = useState(null);
  const [form] = Form.useForm();

  const { user } = useAuthStore();
  const isAdmin = ['super_admin', 'company_admin'].includes(user?.role?.name);

  // Sabablarni olish
  const fetchReasons = async () => {
    setLoading(true);
    try {
      const response = await api.get('/work-status-reasons');
      setReasons(response.data.data || []);
    } catch (error) {
      console.error('Error fetching reasons:', error);
      message.error('Sabablarni olishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  // Kategoriyalarni olish
  const fetchCategories = async () => {
    try {
      const response = await api.get('/work-status-reasons/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchReasons();
    fetchCategories();
  }, []);

  // Yangi sabab qo'shish
  const handleCreate = () => {
    setEditingReason(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Sababni tahrirlash
  const handleEdit = (reason) => {
    setEditingReason(reason);
    form.setFieldsValue(reason);
    setModalVisible(true);
  };

  // Sabab saqlash
  const handleSave = async (values) => {
    try {
      if (editingReason) {
        await api.put(`/work-status-reasons/${editingReason.id}`, values);
        message.success('Sabab muvaffaqiyatli yangilandi');
      } else {
        await api.post('/work-status-reasons', values);
        message.success('Sabab muvaffaqiyatli yaratildi');
      }
      
      setModalVisible(false);
      fetchReasons();
    } catch (error) {
      console.error('Error saving reason:', error);
      message.error(editingReason ? 'Yangilashda xatolik' : 'Yaratishda xatolik');
    }
  };

  // Sababni o'chirish
  const handleDelete = async (id) => {
    try {
      await api.delete(`/work-status-reasons/${id}`);
      message.success('Sabab muvaffaqiyatli o\'chirildi');
      fetchReasons();
    } catch (error) {
      console.error('Error deleting reason:', error);
      message.error('O\'chirishda xatolik');
    }
  };

  // Sababni qayta faollashtirish
  const handleActivate = async (id) => {
    try {
      await api.put(`/work-status-reasons/${id}/activate`);
      message.success('Sabab muvaffaqiyatli faollashtirildi');
      fetchReasons();
    } catch (error) {
      console.error('Error activating reason:', error);
      message.error('Faollashtirshda xatolik');
    }
  };

  // Jadval ustunlari
  const columns = [
    {
      title: 'Nomi',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          {record.description && (
            <div style={{ color: '#666', fontSize: '12px' }}>
              {record.description}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Kategoriya',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (category) => {
        const categoryInfo = categories.find(c => c.value === category);
        return (
          <Tag color={categoryInfo?.color || 'default'}>
            {categoryInfo?.label || category}
          </Tag>
        );
      }
    },
    {
      title: 'Jiddiylik',
      dataIndex: 'severity',
      key: 'severity',
      width: 120,
      render: (severity) => {
        const severityConfig = {
          low: { color: 'green', text: 'Past' },
          medium: { color: 'orange', text: 'O\'rta' },
          high: { color: 'red', text: 'Yuqori' },
          critical: { color: 'red', text: 'Kritik' }
        };
        
        const config = severityConfig[severity] || severityConfig.medium;
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: 'Holat',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Faol' : 'Nofaol'}
        </Tag>
      )
    },
    {
      title: 'Yaratuvchi',
      key: 'creator',
      width: 150,
      render: (record) => {
        if (record.creator) {
          const fullName = `${record.creator.last_name || ''} ${record.creator.first_name || ''}`.trim();
          return fullName || record.creator.username || '-';
        }
        return '-';
      }
    },
    {
      title: 'Yaratilgan',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString('uz-UZ')
    },
    ...(isAdmin ? [{
      title: 'Amallar',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            Tahrirlash
          </Button>
          
          {record.is_active ? (
            user?.role?.name === 'super_admin' && (
              <Popconfirm
                title="Sababni o'chirasizmi?"
                description="Bu sabab nofaol holatga o'tadi"
                onConfirm={() => handleDelete(record.id)}
                okText="Ha"
                cancelText="Yo'q"
              >
                <Button
                  icon={<DeleteOutlined />}
                  size="small"
                  danger
                >
                  O'chirish
                </Button>
              </Popconfirm>
            )
          ) : (
            <Button
              icon={<RedoOutlined />}
              size="small"
              onClick={() => handleActivate(record.id)}
            >
              Faollashtirish
            </Button>
          )}
        </Space>
      )
    }] : [])
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <div>
              <Title level={3} style={{ margin: 0 }}>
                <ExclamationCircleOutlined /> Sabablar
              </Title>
              {user && (
                <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                  {user.role?.name === 'operator' && (
                    <span>Faqat ko'rish huquqi</span>
                  )}
                  {user.role?.name === 'company_admin' && (
                    <span>Korxona admin - Sabablar boshqaruvi</span>
                  )}
                  {user.role?.name === 'super_admin' && (
                    <span>To'liq boshqaruv huquqi</span>
                  )}
                </div>
              )}
            </div>
          </Col>
          {isAdmin && (
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Yangi sabab
              </Button>
            </Col>
          )}
        </Row>
      </div>

      {/* Sabablar jadvali */}
      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={reasons}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} / ${total} ta`
            }}
            scroll={{ x: 'max-content' }}
          />
        </Spin>
      </Card>

      {/* Sabab qo'shish/tahrirlash modali */}
      <Modal
        title={editingReason ? 'Sababni tahrirlash' : 'Yangi sabab yaratish'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="name"
            label="Sabab nomi"
            rules={[
              { required: true, message: 'Sabab nomini kiriting' },
              { min: 2, message: 'Kamida 2 ta belgi' },
              { max: 100, message: 'Maksimal 100 ta belgi' }
            ]}
          >
            <Input placeholder="Masalan: Dvigatel ishlamayapti" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Tavsif"
            rules={[
              { max: 500, message: 'Maksimal 500 ta belgi' }
            ]}
          >
            <TextArea 
              rows={3}
              placeholder="Sabab haqida batafsil ma'lumot..."
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Kategoriya"
                rules={[{ required: true, message: 'Kategoriyani tanlang' }]}
              >
                <Select placeholder="Kategoriyani tanlang">
                  {categories.map(category => (
                    <Option key={category.value} value={category.value}>
                      <Tag color={category.color}>{category.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="severity"
                label="Jiddiylik darajasi"
                rules={[{ required: true, message: 'Jiddiylik darajasini tanlang' }]}
              >
                <Select placeholder="Jiddiylik darajasini tanlang">
                  <Option value="low">
                    <Tag color="green">Past</Tag>
                  </Option>
                  <Option value="medium">
                    <Tag color="orange">O'rta</Tag>
                  </Option>
                  <Option value="high">
                    <Tag color="red">Yuqori</Tag>
                  </Option>
                  <Option value="critical">
                    <Tag color="red">Kritik</Tag>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {editingReason && (
            <Form.Item
              name="is_active"
              label="Holat"
            >
              <Select>
                <Option value={true}>
                  <Tag color="green">Faol</Tag>
                </Option>
                <Option value={false}>
                  <Tag color="red">Nofaol</Tag>
                </Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingReason ? 'Yangilash' : 'Yaratish'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Bekor qilish
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkStatusReasons;
