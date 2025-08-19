import React, { useState } from 'react';
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
  Row,
  Col,
  Switch,
  Tag,
  Tooltip,
  Descriptions,
  Avatar,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  SearchOutlined,
  UserOutlined,
  SettingOutlined,
  TeamOutlined,
  SafetyOutlined,
  KeyOutlined
} from '@ant-design/icons';
import { useQuery, useMutation } from 'react-query';
import { usersAPI, rolesAPI, companiesAPI, districtsAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const { Password } = Input;

const Users = () => {
  const [form] = Form.useForm();
  const [permissionsForm] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const { hasPermission, user: currentUser } = useAuthStore();


  // Foydalanuvchilar ro'yxatini olish
  const { data: usersData, isLoading, refetch } = useQuery(
    ['users', pagination.current, pagination.pageSize, searchText, selectedRole, selectedCompany],
    () => usersAPI.getAll({
      page: pagination.current,
      limit: pagination.pageSize,
      search: searchText,
      role: selectedRole,
      company_id: selectedCompany
    }),
    {
      onSuccess: (data) => {
        setPagination(prev => ({
          ...prev,
          total: data.data.pagination.total_items
        }));
      },
      onError: (error) => {
        message.error('Foydalanuvchilarni yuklashda xatolik: ' + error.message);
      }
    }
  );

  // Rollar ro'yxatini olish
  const { data: rolesData } = useQuery(
    ['roles'],
    () => rolesAPI.getAll(),
    {
      onError: (error) => {
        message.error('Rollarni yuklashda xatolik: ' + error.message);
      }
    }
  );

  // Kompaniyalar ro'yxatini olish
  const { data: companiesData } = useQuery(
    ['companies'],
    () => companiesAPI.getAll({ limit: 100 }),
    {
      enabled: currentUser?.role?.name === 'super_admin',
      onError: (error) => {
        message.error('Kompaniyalarni yuklashda xatolik: ' + error.message);
      }
    }
  );

  // Tumanlar ro'yxatini olish
  const { data: districtsData } = useQuery(
    ['districts-for-users'],
    () => districtsAPI.getAll({ limit: 100 }),
    {
      onError: (error) => {
        message.error('Tumanlarni yuklashda xatolik: ' + error.message);
      }
    }
  );

  // Yangi foydalanuvchi yaratish yoki tahrirlash
  const createOrUpdateMutation = useMutation(
    (data) => {
      if (editingUser) {
        return usersAPI.update(editingUser.id, data);
      }
      return usersAPI.create(data);
    },
    {
      onSuccess: () => {
        message.success(editingUser ? 'Foydalanuvchi yangilandi' : 'Foydalanuvchi yaratildi');
        setIsModalOpen(false);
        setEditingUser(null);
        form.resetFields();
        refetch();
      },
      onError: (error) => {
        message.error('Xatolik: ' + (error.response?.data?.error || error.message));
      }
    }
  );

  // Foydalanuvchi holatini o'zgartirish
  const updateStatusMutation = useMutation(
    ({ id, is_active }) => usersAPI.update(id, { is_active }),
    {
      onSuccess: () => {
        message.success('Foydalanuvchi holati o\'zgartirildi');
        refetch();
      },
      onError: (error) => {
        message.error('Xatolik: ' + (error.response?.data?.error || error.message));
      }
    }
  );

  // Parolni tiklash
  const resetPasswordMutation = useMutation(
    ({ id, newPassword }) => usersAPI.resetPassword(id, { password: newPassword }),
    {
      onSuccess: () => {
        message.success('Parol muvaffaqiyatli o\'zgartirildi');
        refetch();
      },
      onError: (error) => {
        message.error('Parolni o\'zgartirishda xatolik: ' + (error.response?.data?.error || error.message));
      }
    }
  );

  // Ruxsatlarni yangilash
  const updatePermissionsMutation = useMutation(
    ({ id, permissions }) => usersAPI.updatePermissions(id, { permissions }),
    {
      onSuccess: () => {
        message.success('Ruxsatlar muvaffaqiyatli yangilandi');
        setIsPermissionsModalOpen(false);
        setSelectedUser(null);
        permissionsForm.resetFields();
        refetch();
      },
      onError: (error) => {
        message.error('Ruxsatlarni yangilashda xatolik: ' + (error.response?.data?.error || error.message));
      }
    }
  );

  // Modal ochish/yopish
  const handleOpenModal = (user = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
    
    if (user) {
      form.setFieldsValue({
        ...user,
        company_id: user.company?.id,
        role_id: user.role?.id,
        district_access: user.district_access || []
      });
      // User ning kompaniyasiga tegishli tumanlarni yuklash
      if (user.company?.id) {
        handleCompanyChange(user.company.id);
      }
    } else {
      form.resetFields();
      setFilteredDistricts([]);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    form.resetFields();
  };

  // Ruxsatlar modalini ochish
  const handleOpenPermissionsModal = (user) => {
    setSelectedUser(user);
    setIsPermissionsModalOpen(true);
    
    // Foydalanuvchining hozirgi ruxsatlarini form ga yuklash
    const userPermissions = user.permissions || {};
    permissionsForm.setFieldsValue(userPermissions);
  };

  // Form submit
  const handleSubmit = (values) => {
    createOrUpdateMutation.mutate(values);
  };

  // Ruxsatlarni saqlash
  const handleSavePermissions = (values) => {
    updatePermissionsMutation.mutate({
      id: selectedUser.id,
      permissions: values
    });
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

  // Role filtri
  const handleRoleFilter = (value) => {
    setSelectedRole(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Company filtri
  const handleCompanyFilter = (value) => {
    setSelectedCompany(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Kompaniya tanlanganda tumanlarni filterlash
  const handleCompanyChange = (companyId) => {
    if (companyId && districtsData?.data?.districts) {
      const filtered = districtsData.data.districts.filter(
        district => district.company_id === companyId
      );
      setFilteredDistricts(filtered);
    } else {
      setFilteredDistricts([]);
    }
  };

  // Parol tiklash
  const handleResetPassword = (user) => {
    Modal.confirm({
      title: 'Parolni tiklash',
      content: (
        <div>
          <p>Foydalanuvchi: <strong>{user.username}</strong></p>
          <p>Yangi parol kiritilsinmi?</p>
          <Input.Password 
            placeholder="Yangi parol"
            id="newPassword"
            style={{ marginTop: 8 }}
          />
        </div>
      ),
      onOk: () => {
        const newPassword = document.getElementById('newPassword').value;
        if (!newPassword || newPassword.length < 6) {
          message.error('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
          return;
        }
        resetPasswordMutation.mutate({ id: user.id, newPassword });
      }
    });
  };

  // Rol rangini aniqlash
  const getRoleColor = (roleName) => {
    const colors = {
      'super_admin': 'red',
      'company_director': 'purple',
      'company_admin': 'blue',
      'company_accountant': 'cyan',
      'district_director': 'green',
      'district_manager': 'lime',
      'district_accountant': 'orange',
      'district_operator': 'gold',
      'operator': 'geekblue',
      'driver': 'volcano'
    };
    return colors[roleName] || 'default';
  };

  // Modullar ro'yxati
  const modulePermissions = [
    { key: 'companies', label: 'Kompaniyalar', view: 'view_companies', edit: 'edit_companies', create: 'create_companies', delete: 'delete_companies' },
    { key: 'districts', label: 'Tumanlar', view: 'view_districts', edit: 'edit_districts', create: 'create_districts', delete: 'delete_districts' },
    { key: 'neighborhoods', label: 'Maxallalar', view: 'view_neighborhoods', edit: 'edit_neighborhoods', create: 'create_neighborhoods', delete: 'delete_neighborhoods' },
    { key: 'users', label: 'Foydalanuvchilar', view: 'view_users', edit: 'edit_users', create: 'create_users', delete: 'delete_users' },
    { key: 'physical_persons', label: 'Jismoniy shaxslar', view: 'view_physical_persons', edit: 'edit_physical_persons' },
    { key: 'legal_entities', label: 'Yuridik shaxslar', view: 'view_legal_entities', edit: 'edit_legal_entities' },
    { key: 'vehicles', label: 'Texnika vositalari', view: 'view_vehicles', edit: 'edit_vehicles' },
    { key: 'service_quality', label: 'Xizmat sifati', view: 'view_service_quality', edit: 'edit_service_quality' },
    { key: 'employees', label: 'Xodimlar', view: 'view_employees', edit: 'edit_employees' },
    { key: 'reports', label: 'Hisobotlar', view: 'view_reports', export: 'export_reports' }
  ];

  // Jadval ustunlari
  const columns = [
    {
      title: 'Foydalanuvchi',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar 
            icon={<UserOutlined />} 
            style={{ backgroundColor: getRoleColor(record.role?.name) }}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {record.first_name} {record.last_name}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              @{record.username} • {record.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Rol',
      key: 'role',
      render: (_, record) => (
        <Tag color={getRoleColor(record.role?.name)}>
          {record.role?.display_name || record.role?.name}
        </Tag>
      ),
    },
    {
      title: 'Kompaniya/Tuman',
      key: 'organization',
      render: (_, record) => (
        <div>
          {record.company && (
            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
              {record.company.name}
            </div>
          )}
          {record.district_access && record.district_access.length > 0 ? (
            <div style={{ fontSize: '11px', color: '#666' }}>
              🏘️ {record.district_access.length} ta tuman ruxsati
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: '#999' }}>
              📍 Barcha tumanlarga ruxsat
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Oxirgi kirish',
      dataIndex: 'last_login',
      key: 'last_login',
      render: (text) => text ? new Date(text).toLocaleDateString() : 'Hech qachon',
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
          disabled={!hasPermission('edit_users') || record.id === currentUser?.id}
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
              disabled={!hasPermission('edit_users')}
            />
          </Tooltip>
          
          <Tooltip title="Ruxsatlar">
            <Button
              type="link"
              icon={<SettingOutlined />}
              onClick={() => handleOpenPermissionsModal(record)}
              disabled={!hasPermission('edit_users') || currentUser?.role?.name !== 'super_admin'}
            />
          </Tooltip>
          
          <Tooltip title="Parolni tiklash">
            <Button
              type="link"
              icon={<KeyOutlined />}
              onClick={() => handleResetPassword(record)}
              disabled={!hasPermission('edit_users') || currentUser?.role?.name !== 'super_admin'}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="users-page fade-in">
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <TeamOutlined style={{ marginRight: 8 }} />
          Foydalanuvchilar boshqaruvi
        </Title>
        <Text type="secondary">
          Tizim foydalanuvchilari va ularning ruxsatlarini boshqaring
        </Text>
      </div>

      <Card>
        {/* Filtrlar va qidiruv */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8} md={6}>
            <Search
              placeholder="Ism, username yoki email"
              allowClear
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
            />
          </Col>
          
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Rolni tanlang"
              allowClear
              style={{ width: '100%' }}
              onChange={handleRoleFilter}
              value={selectedRole}
            >
              {rolesData?.data?.roles?.map(role => (
                <Option key={role.id} value={role.name}>
                  {role.display_name || role.name}
                </Option>
              ))}
            </Select>
          </Col>
          
          {currentUser?.role?.name === 'super_admin' && (
            <Col xs={24} sm={8} md={4}>
              <Select
                placeholder="Kompaniyani tanlang"
                allowClear
                style={{ width: '100%' }}
                onChange={handleCompanyFilter}
                value={selectedCompany}
              >
                {companiesData?.data?.companies?.map(company => (
                  <Option key={company.id} value={company.id}>
                    {company.name}
                  </Option>
                ))}
              </Select>
            </Col>
          )}
          
          <Col xs={24} sm={24} md={6} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
              disabled={!hasPermission('create_users') || currentUser?.role?.name !== 'super_admin'}
            >
              Yangi foydalanuvchi
            </Button>
          </Col>
        </Row>

        {/* Statistika */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Text strong style={{ fontSize: '24px', color: '#1890ff' }}>
                  {usersData?.data?.users?.length || 0}
                </Text>
                <br />
                <Text type="secondary">Jami foydalanuvchilar</Text>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Text strong style={{ fontSize: '24px', color: '#52c41a' }}>
                  {usersData?.data?.users?.filter(u => u.is_active)?.length || 0}
                </Text>
                <br />
                <Text type="secondary">Faol foydalanuvchilar</Text>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Text strong style={{ fontSize: '24px', color: '#722ed1' }}>
                  {rolesData?.data?.roles?.length || 0}
                </Text>
                <br />
                <Text type="secondary">Rollar soni</Text>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Text strong style={{ fontSize: '24px', color: '#fa8c16' }}>
                  {companiesData?.data?.companies?.length || 0}
                </Text>
                <br />
                <Text type="secondary">Kompaniyalar</Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Jadval */}
        <Table
          columns={columns}
          dataSource={usersData?.data?.users || []}
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
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Qo'shish/Tahrirlash modal */}
      <Modal
        title={
          <Space>
            <UserOutlined />
            {editingUser ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi qo\'shish'}
          </Space>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="first_name"
                label="Ism"
                rules={[
                  { required: true, message: 'Ismni kiriting' },
                  { min: 2, message: 'Kamida 2 ta belgi' }
                ]}
              >
                <Input placeholder="Ismni kiriting" />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12}>
              <Form.Item
                name="last_name"
                label="Familiya"
                rules={[
                  { required: true, message: 'Familiyani kiriting' },
                  { min: 2, message: 'Kamida 2 ta belgi' }
                ]}
              >
                <Input placeholder="Familiyani kiriting" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="username"
                label="Username"
                rules={[
                  { required: true, message: 'Username ni kiriting' },
                  { min: 3, message: 'Kamida 3 ta belgi' },
                  { pattern: /^[a-zA-Z0-9_]+$/, message: 'Faqat harflar, raqamlar va _ belgisi' }
                ]}
              >
                <Input placeholder="Username ni kiriting" />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Email ni kiriting' },
                  { type: 'email', message: 'To\'g\'ri email formatini kiriting' }
                ]}
              >
                <Input placeholder="email@example.com" />
              </Form.Item>
            </Col>
          </Row>

          {!editingUser && (
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="password"
                  label="Parol"
                  rules={[
                    { required: true, message: 'Parolni kiriting' },
                    { min: 6, message: 'Kamida 6 ta belgi' }
                  ]}
                >
                  <Password placeholder="Parolni kiriting" />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="confirm_password"
                  label="Parolni tasdiqlash"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Parolni tasdiqlang' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Parollar mos kelmaydi'));
                      },
                    }),
                  ]}
                >
                  <Password placeholder="Parolni qayta kiriting" />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="role_id"
                label="Rol"
                rules={[{ required: true, message: 'Rolni tanlang' }]}
              >
                <Select placeholder="Rolni tanlang">
                  {rolesData?.data?.roles?.map(role => (
                    <Option key={role.id} value={role.id}>
                      <Tag color={getRoleColor(role.name)}>
                        {role.display_name || role.name}
                      </Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12}>
              <Form.Item
                name="company_id"
                label="Kompaniya"
                rules={[{ required: true, message: 'Kompaniyani tanlang' }]}
              >
                <Select 
                  placeholder="Kompaniyani tanlang"
                  onChange={handleCompanyChange}
                >
                  {companiesData?.data?.companies?.map(company => (
                    <Option key={company.id} value={company.id}>
                      {company.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item
                name="district_access"
                label="Ruxsat berilgan tumanlar"
                tooltip="Foydalanuvchi qaysi tumanlarga kirish huquqiga ega bo'ladi"
              >
                <Select
                  mode="multiple"
                  placeholder="Tumanlarni tanlang (bo'sh qoldirsa barcha tumanlarga ruxsat)"
                  allowClear
                  style={{ width: '100%' }}
                  disabled={filteredDistricts.length === 0}
                  notFoundContent={filteredDistricts.length === 0 ? "Avval kompaniyani tanlang" : "Tumanlar topilmadi"}
                >
                  {filteredDistricts.map(district => (
                    <Option key={district.id} value={district.id}>
                      {district.name} ({district.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="phone"
            label="Telefon raqami"
          >
            <Input placeholder="+998 90 123 45 67" />
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
                {editingUser ? 'Yangilash' : 'Yaratish'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Ruxsatlar modal */}
      <Modal
        title={
          <Space>
            <SafetyOutlined />
            Ruxsatlarni boshqarish
            {selectedUser && (
              <Tag color={getRoleColor(selectedUser.role?.name)}>
                {selectedUser.username}
              </Tag>
            )}
          </Space>
        }
        open={isPermissionsModalOpen}
        onCancel={() => {
          setIsPermissionsModalOpen(false);
          setSelectedUser(null);
          permissionsForm.resetFields();
        }}
        width={800}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => setIsPermissionsModalOpen(false)}
          >
            Bekor qilish
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            onClick={() => permissionsForm.submit()}
            loading={updatePermissionsMutation.isLoading}
          >
            Saqlash
          </Button>
        ]}
      >
        {selectedUser && (
          <>
            <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Foydalanuvchi">
                {selectedUser.first_name} {selectedUser.last_name}
              </Descriptions.Item>
              <Descriptions.Item label="Rol">
                <Tag color={getRoleColor(selectedUser.role?.name)}>
                  {selectedUser.role?.display_name}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Kompaniya">
                {selectedUser.company?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedUser.email}
              </Descriptions.Item>
            </Descriptions>
            
            <Divider />
            
            <Form
              form={permissionsForm}
              onFinish={handleSavePermissions}
              layout="vertical"
            >
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {modulePermissions.map(module => (
                  <Card key={module.key} size="small" style={{ marginBottom: 8 }}>
                    <Row align="middle">
                      <Col span={6}>
                        <Text strong>{module.label}</Text>
                      </Col>
                      <Col span={18}>
                        <Space>
                          {module.view && (
                            <Form.Item 
                              name={module.view} 
                              valuePropName="checked" 
                              style={{ margin: 0 }}
                            >
                              <Switch 
                                size="small" 
                                checkedChildren="Ko'rish" 
                                unCheckedChildren="Ko'rish" 
                              />
                            </Form.Item>
                          )}
                          {module.edit && (
                            <Form.Item 
                              name={module.edit} 
                              valuePropName="checked" 
                              style={{ margin: 0 }}
                            >
                              <Switch 
                                size="small" 
                                checkedChildren="Tahrirlash" 
                                unCheckedChildren="Tahrirlash" 
                              />
                            </Form.Item>
                          )}
                          {module.create && (
                            <Form.Item 
                              name={module.create} 
                              valuePropName="checked" 
                              style={{ margin: 0 }}
                            >
                              <Switch 
                                size="small" 
                                checkedChildren="Yaratish" 
                                unCheckedChildren="Yaratish" 
                              />
                            </Form.Item>
                          )}
                          {module.delete && (
                            <Form.Item 
                              name={module.delete} 
                              valuePropName="checked" 
                              style={{ margin: 0 }}
                            >
                              <Switch 
                                size="small" 
                                checkedChildren="O'chirish" 
                                unCheckedChildren="O'chirish" 
                              />
                            </Form.Item>
                          )}
                          {module.export && (
                            <Form.Item 
                              name={module.export} 
                              valuePropName="checked" 
                              style={{ margin: 0 }}
                            >
                              <Switch 
                                size="small" 
                                checkedChildren="Export" 
                                unCheckedChildren="Export" 
                              />
                            </Form.Item>
                          )}
                        </Space>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </div>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Users;