import React, { useState } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Table, 
  Switch, 
  Input, 
  Space, 
  Modal, 
  Form, 
  message, 
  Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  BankOutlined,
  PhoneOutlined,
  MailOutlined
} from '@ant-design/icons';
import { useQuery, useMutation } from 'react-query';
import { companiesAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const { Title } = Typography;
const { Search } = Input;

const Companies = () => {
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const { hasPermission } = useAuthStore();


  // Korxonalar ro'yxatini olish
  const { data: companiesData, isLoading, refetch } = useQuery(
    ['companies', pagination.current, pagination.pageSize, searchText],
    () => companiesAPI.getAll({
      page: pagination.current,
      limit: pagination.pageSize,
      search: searchText
    }),
    {
      onSuccess: (data) => {
        setPagination(prev => ({
          ...prev,
          total: data.data.pagination.total_items
        }));
      },
      onError: (error) => {
        message.error('Korxonalarni yuklashda xatolik: ' + error.message);
      }
    }
  );

  // Yangi korxona yaratish yoki tahrirlash
  const createOrUpdateMutation = useMutation(
    (data) => {
      if (editingCompany) {
        return companiesAPI.update(editingCompany.id, data);
      }
      return companiesAPI.create(data);
    },
    {
      onSuccess: () => {
        message.success(editingCompany ? 'Korxona yangilandi' : 'Korxona yaratildi');
        setIsModalOpen(false);
        setEditingCompany(null);
        form.resetFields();
        refetch();
      },
      onError: (error) => {
        message.error('Xatolik: ' + (error.response?.data?.error || error.message));
      }
    }
  );

  // Korxona holatini o'zgartirish
  const updateStatusMutation = useMutation(
    ({ id, is_active }) => companiesAPI.update(id, { is_active }),
    {
      onSuccess: () => {
        message.success('Korxona holati o\'zgartirildi');
        refetch();
      },
      onError: (error) => {
        message.error('Xatolik: ' + (error.response?.data?.error || error.message));
      }
    }
  );

  // Modal ochish/yopish
  const handleOpenModal = (company = null) => {
    setEditingCompany(company);
    setIsModalOpen(true);
    
    if (company) {
      form.setFieldsValue(company);
    } else {
      form.resetFields();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCompany(null);
    form.resetFields();
  };

  // Form submit
  const handleSubmit = (values) => {
    createOrUpdateMutation.mutate(values);
  };

  // Status o'zgartirish
  const handleStatusChange = (checked, record) => {
    updateStatusMutation.mutate({
      id: record.id,
      is_active: checked
    });
  };

  // Qidiruv
  const handleSearch = (value) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Jadval ustunlari
  const columns = [
    {
      title: 'Korxona nomi',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <BankOutlined style={{ color: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Kod: {record.code}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Aloqa ma\'lumotlari',
      key: 'contact',
      render: (_, record) => (
        <div>
          {record.phone && (
            <div style={{ fontSize: '12px', marginBottom: 4 }}>
              <PhoneOutlined style={{ marginRight: 4, color: '#52c41a' }} />
              {record.phone}
            </div>
          )}
          {record.email && (
            <div style={{ fontSize: '12px' }}>
              <MailOutlined style={{ marginRight: 4, color: '#722ed1' }} />
              {record.email}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'INN / Hisob raqam',
      key: 'financial',
      render: (_, record) => (
        <div>
          {record.inn && (
            <div style={{ fontSize: '12px', marginBottom: 4 }}>
              <span style={{ fontWeight: 'bold', color: '#1890ff' }}>INN:</span>
              <span style={{ marginLeft: 4 }}>{record.inn}</span>
            </div>
          )}
          {record.bank_account && (
            <div style={{ fontSize: '12px' }}>
              <span style={{ fontWeight: 'bold', color: '#52c41a' }}>Hisob:</span>
              <span style={{ marginLeft: 4 }}>{record.bank_account}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Direktor',
      dataIndex: 'director_name',
      key: 'director_name',
      render: (text) => text || '-',
    },
    {
      title: 'Litsenziya',
      dataIndex: 'license_number',
      key: 'license_number',
      render: (text) => text || '-',
    },
    {
      title: 'Holat',
      key: 'is_active',
      align: 'center',
      render: (_, record) => (
        <Switch
          checked={record.is_active}
          onChange={(checked) => handleStatusChange(checked, record)}
          checkedChildren="Faol"
          unCheckedChildren="Faolsiz"
          loading={updateStatusMutation.isLoading}
          disabled={!hasPermission('edit_companies')}
        />
      ),
    },
    {
      title: 'Amallar',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="Tahrirlash">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
              disabled={!hasPermission('edit_companies')}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="companies-page fade-in">
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Korxonalar boshqaruvi
        </Title>
      </div>

      <Card>
        {/* Harakatlar paneli */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Search
            placeholder="Korxona nomi yoki kodi bo'yicha qidirish"
            allowClear
            style={{ width: 300 }}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
          />
          
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            disabled={!hasPermission('create_companies')}
          >
            Yangi korxona
          </Button>
        </div>

        {/* Jadval */}
        <Table
          columns={columns}
          dataSource={companiesData?.data?.companies || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} dan ${total} ta`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: pageSize
              }));
            },
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Qo'shish/Tahrirlash modal */}
      <Modal
        title={editingCompany ? 'Korxonani tahrirlash' : 'Yangi korxona qo\'shish'}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="Korxona nomi"
            rules={[
              { required: true, message: 'Korxona nomini kiriting' },
              { min: 2, message: 'Kamida 2 ta belgi kiriting' }
            ]}
          >
            <Input placeholder="Korxona nomini kiriting" />
          </Form.Item>

          <Form.Item
            name="code"
            label="Korxona kodi"
            rules={[
              { required: true, message: 'Korxona kodini kiriting' },
              { min: 2, max: 10, message: '2-10 ta belgi kiriting' }
            ]}
          >
            <Input placeholder="Masalan: ABF, ZW" style={{ textTransform: 'uppercase' }} />
          </Form.Item>

          <Form.Item
            name="inn"
            label="INN raqami"
            rules={[
              { required: true, message: 'INN raqamini kiriting' },
              { pattern: /^\d{9}$/, message: 'INN raqami 9 ta raqamdan iborat bo\'lishi kerak' }
            ]}
          >
            <Input placeholder="123456789" maxLength={9} />
          </Form.Item>

          <Form.Item
            name="bank_account"
            label="Hisob raqami"
            rules={[
              { len: 20, message: 'Hisob raqami 20 ta belgidan iborat bo\'lishi kerak' }
            ]}
          >
            <Input placeholder="12345678901234567890" maxLength={20} />
          </Form.Item>

          <Form.Item
            name="director_name"
            label="Direktor ismi"
          >
            <Input placeholder="Direktor F.I.Sh." />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Telefon raqami"
          >
            <Input placeholder="+998 90 123-45-67" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email manzil"
            rules={[
              { type: 'email', message: 'Email formatini to\'g\'ri kiriting' }
            ]}
          >
            <Input placeholder="info@company.uz" />
          </Form.Item>

          <Form.Item
            name="address"
            label="Manzil"
          >
            <Input.TextArea rows={2} placeholder="Korxona manzili" />
          </Form.Item>

          <Form.Item
            name="license_number"
            label="Litsenziya raqami"
          >
            <Input placeholder="Litsenziya raqami" />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={handleCloseModal}>
                Bekor qilish
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={createOrUpdateMutation.isLoading}
              >
                {editingCompany ? 'Yangilash' : 'Yaratish'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Companies;
