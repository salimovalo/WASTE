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
  Select,
  Tag,
  Tooltip,
  Upload,
  Row,
  Col
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  EnvironmentOutlined,
  HomeOutlined,
  UploadOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { useQuery, useMutation } from 'react-query';
import { neighborhoodsAPI, districtsAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useSelectedCompany } from '../../components/Layout/CompanySelector';
import * as XLSX from 'xlsx';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const Neighborhoods = () => {
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingNeighborhood, setEditingNeighborhood] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const { hasPermission } = useAuthStore();
  const { selectedCompany } = useSelectedCompany();


  // Tumanlar ro'yxatini olish
  const { data: districtsData } = useQuery(
    ['districts', selectedCompany?.id],
    () => districtsAPI.getAll({
      company_id: selectedCompany?.id,
      limit: 100
    }),
    {
      enabled: !!selectedCompany?.id
    }
  );

  // Maxallalar ro'yxatini olish
  const { data: neighborhoodsData, isLoading, refetch } = useQuery(
    ['neighborhoods', pagination.current, pagination.pageSize, searchText, selectedDistrict, selectedCompany?.id],
    () => neighborhoodsAPI.getAll({
      page: pagination.current,
      limit: pagination.pageSize,
      search: searchText,
      district_id: selectedDistrict,
      company_id: selectedCompany?.id
    }),
    {
      enabled: !!selectedCompany?.id,
      onSuccess: (data) => {
        setPagination(prev => ({
          ...prev,
          total: data.data.pagination.total_items
        }));
      },
      onError: (error) => {
        message.error('Maxallalarni yuklashda xatolik: ' + error.message);
      }
    }
  );

  // Yangi maxalla yaratish yoki tahrirlash
  const createOrUpdateMutation = useMutation(
    (data) => {
      if (editingNeighborhood) {
        return neighborhoodsAPI.update(editingNeighborhood.id, data);
      }
      return neighborhoodsAPI.create(data);
    },
    {
      onSuccess: () => {
        message.success(editingNeighborhood ? 'Maxalla yangilandi' : 'Maxalla yaratildi');
        setIsModalOpen(false);
        setEditingNeighborhood(null);
        form.resetFields();
        refetch();
      },
      onError: (error) => {
        message.error('Xatolik: ' + (error.response?.data?.error || error.message));
      }
    }
  );

  // Maxalla holatini o'zgartirish
  const updateStatusMutation = useMutation(
    ({ id, is_active }) => neighborhoodsAPI.update(id, { is_active }),
    {
      onSuccess: () => {
        message.success('Maxalla holati o\'zgartirildi');
        refetch();
      },
      onError: (error) => {
        message.error('Xatolik: ' + (error.response?.data?.error || error.message));
      }
    }
  );

  // Excel import
  const importMutation = useMutation(
    (file) => neighborhoodsAPI.importExcel(file),
    {
      onSuccess: (response) => {
        const { results } = response.data;
        if (results.errors.length > 0) {
          Modal.warning({
            title: 'Import natijasi',
            content: (
              <div>
                <p>Muvaffaqiyatli: {results.success} ta</p>
                <p>Xatoliklar: {results.errors.length} ta</p>
                <ul>
                  {results.errors.slice(0, 5).map((err, index) => (
                    <li key={index}>Qator {err.row}: {err.error}</li>
                  ))}
                  {results.errors.length > 5 && <li>... va boshqalar</li>}
                </ul>
              </div>
            ),
            width: 600
          });
        } else {
          message.success(`${results.success} ta maxalla muvaffaqiyatli import qilindi`);
        }
        setIsImportModalOpen(false);
        setFileList([]);
        refetch();
      },
      onError: (error) => {
        message.error('Import xatoligi: ' + (error.response?.data?.error || error.message));
      }
    }
  );

  // Modal ochish/yopish
  const handleOpenModal = (neighborhood = null) => {
    setEditingNeighborhood(neighborhood);
    setIsModalOpen(true);
    
    if (neighborhood) {
      form.setFieldsValue({
        ...neighborhood,
        district_id: neighborhood.district?.id
      });
    } else {
      form.resetFields();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNeighborhood(null);
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

  // Tuman filtri
  const handleDistrictFilter = (value) => {
    setSelectedDistrict(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Excel import
  const handleImport = () => {
    if (fileList.length === 0) {
      message.error('Excel fayl tanlang');
      return;
    }
    
    importMutation.mutate(fileList[0].originFileObj);
  };

  // Excel template yuklab olish
  const downloadTemplate = () => {
    const templateData = [
      {
        district_id: 1,
        name: 'Markaziy maxalla',
        tozamakon_id: 'TZM001',
        type: 'rural'
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Maxallalar');
    XLSX.writeFile(workbook, 'maxallalar_template.xlsx');
  };

  // Maxalla turini formatlash
  const formatType = (type) => {
    const types = {
      'rural': { text: 'Yerli', color: 'green' },
      'apartment_complex': { text: 'Ko\'p qavatli', color: 'blue' },
      'mixed': { text: 'Aralash', color: 'orange' }
    };
    const typeInfo = types[type] || { text: type, color: 'default' };
    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
  };

  // Jadval ustunlari
  const columns = [
    {
      title: 'Maxalla nomi',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <HomeOutlined style={{ color: '#52c41a' }} />
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
      title: 'Tuman',
      key: 'district',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.district?.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.district?.company?.name}
          </div>
        </div>
      ),
    },
    {
      title: 'Tozamakon ID',
      dataIndex: 'tozamakon_id',
      key: 'tozamakon_id',
      render: (text) => text || '-',
    },
    {
      title: 'Turi',
      dataIndex: 'type',
      key: 'type',
      render: formatType,
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
          disabled={!hasPermission('edit_neighborhoods')}
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
              disabled={!hasPermission('edit_neighborhoods')}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (!selectedCompany) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <EnvironmentOutlined style={{ fontSize: '48px', color: '#ccc' }} />
          <h3>Korxonani tanlang</h3>
          <p>Maxallalarni ko'rish uchun yuqoridan korxonani tanlang</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="neighborhoods-page fade-in">
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Maxallalar boshqaruvi
        </Title>
      </div>

      <Card>
        {/* Harakatlar paneli */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Maxalla nomi, kodi yoki Tozamakon ID"
              allowClear
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
            />
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Tumanni tanlang"
              allowClear
              style={{ width: '100%' }}
              onChange={handleDistrictFilter}
              value={selectedDistrict}
            >
              {districtsData?.data?.districts?.map(district => (
                <Option key={district.id} value={district.id}>
                  {district.name}
                </Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={24} md={10} style={{ textAlign: 'right' }}>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={downloadTemplate}
              >
                Shablon
              </Button>
              
              <Button
                icon={<UploadOutlined />}
                onClick={() => setIsImportModalOpen(true)}
                disabled={!hasPermission('create_neighborhoods')}
              >
                Excel Import
              </Button>
              
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleOpenModal()}
                disabled={!hasPermission('create_neighborhoods')}
              >
                Yangi maxalla
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Jadval */}
        <Table
          columns={columns}
          dataSource={neighborhoodsData?.data?.neighborhoods || []}
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
        title={editingNeighborhood ? 'Maxallani tahrirlash' : 'Yangi maxalla qo\'shish'}
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
                name="district_id"
                label="Tuman"
                rules={[{ required: true, message: 'Tumanni tanlang' }]}
              >
                <Select placeholder="Tumanni tanlang">
                  {districtsData?.data?.districts?.map(district => (
                    <Option key={district.id} value={district.id}>
                      {district.name} ({district.company?.name})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label="Maxalla nomi"
                rules={[
                  { required: true, message: 'Maxalla nomini kiriting' },
                  { min: 2, message: 'Kamida 2 ta belgi kiriting' }
                ]}
              >
                <Input placeholder="Maxalla nomini kiriting" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="tozamakon_id"
                label="Tozamakon ID"
              >
                <Input placeholder="TZM001" />
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12}>
              <Form.Item
                name="type"
                label="Maxalla turi"
                rules={[{ required: true, message: 'Turni tanlang' }]}
                initialValue="rural"
              >
                <Select placeholder="Turni tanlang">
                  <Option value="rural">Yerli</Option>
                  <Option value="apartment_complex">Ko'p qavatli</Option>
                  <Option value="mixed">Aralash</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

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
                {editingNeighborhood ? 'Yangilash' : 'Yaratish'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Excel Import modal */}
      <Modal
        title="Excel orqali maxallalar import qilish"
        open={isImportModalOpen}
        onCancel={() => {
          setIsImportModalOpen(false);
          setFileList([]);
        }}
        footer={[
          <Button key="cancel" onClick={() => setIsImportModalOpen(false)}>
            Bekor qilish
          </Button>,
          <Button 
            key="import" 
            type="primary" 
            onClick={handleImport}
            loading={importMutation.isLoading}
            disabled={fileList.length === 0}
          >
            Import qilish
          </Button>
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <p>Excel fayl formatini to'g'ri tanlang:</p>
          <ul>
            <li><strong>district_id</strong> - Tuman ID raqami (majburiy)</li>
            <li><strong>name</strong> - Maxalla nomi (majburiy)</li>
            <li><strong>tozamakon_id</strong> - Tozamakon ID (ixtiyoriy)</li>
            <li><strong>type</strong> - rural/apartment_complex/mixed (majburiy)</li>
          </ul>
          <p style={{ color: '#666', fontSize: '12px' }}>
            Maxalla kodi avtomatik yaratiladi.
          </p>
        </div>
        
        <Upload
          beforeUpload={() => false}
          fileList={fileList}
          onChange={({ fileList }) => setFileList(fileList)}
          accept=".xlsx,.xls"
          maxCount={1}
        >
          <Button icon={<UploadOutlined />}>Excel fayl tanlang</Button>
        </Upload>
      </Modal>
    </div>
  );
};

export default Neighborhoods;
