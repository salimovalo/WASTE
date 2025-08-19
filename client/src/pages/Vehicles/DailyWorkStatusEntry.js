import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  DatePicker, 
  Table,
  Button,
  message,
  Space,
  Modal,
  Form,
  Select,
  Input,
  TimePicker,
  Tag,
  Spin,
  Alert
} from 'antd';
import { 
  CalendarOutlined, 
  CarOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  SaveOutlined,
  BackwardOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const DailyWorkStatusEntry = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [vehicles, setVehicles] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [pendingChanges, setPendingChanges] = useState(new Set());
  
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Texnikalar ro'yxatini olish
  const fetchVehicles = async (date = selectedDate) => {
    setLoading(true);
    try {
      const response = await api.get('/daily-work-status/vehicles-for-entry', {
        params: {
          date: date.format('YYYY-MM-DD')
        }
      });
      setVehicles(response.data.data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      message.error('Texnikalar ro\'yxatini olishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  // Sabablar ro'yxatini olish
  const fetchReasons = async () => {
    try {
      const response = await api.get('/work-status-reasons');
      setReasons(response.data.data || []);
    } catch (error) {
      console.error('Error fetching reasons:', error);
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchReasons();
  }, [selectedDate]);

  // "Ishga chiqdi" tugmasini bosish
  const handleWorkingStatus = async (vehicle) => {
    setSaving(true);
    try {
      await api.post('/daily-work-status', {
        vehicle_id: vehicle.id,
        date: selectedDate.format('YYYY-MM-DD'),
        work_status: 'working'
      });

      message.success(`${vehicle.plate_number} - Ishga chiqgan deb belgilandi`);
      fetchVehicles(); // Ro'yxatni yangilash
      setPendingChanges(prev => new Set([...prev, vehicle.id]));
      
    } catch (error) {
      console.error('Error saving working status:', error);
      message.error('Ma\'lumot saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  // "Ishga chiqmadi" tugmasini bosish - sabab kiritish oynasini ochish
  const handleNotWorkingStatus = (vehicle) => {
    setSelectedVehicle(vehicle);
    form.resetFields();
    setModalVisible(true);
  };

  // "Ishga chiqmadi" ma'lumotini saqlash
  const handleSaveNotWorking = async (values) => {
    setSaving(true);
    try {
      await api.post('/daily-work-status', {
        vehicle_id: selectedVehicle.id,
        date: selectedDate.format('YYYY-MM-DD'),
        work_status: 'not_working',
        reason_id: values.reason_id,
        reason_details: values.reason_details,
        notes: values.notes
      });

      message.success(`${selectedVehicle.plate_number} - Ishga chiqmagan deb belgilandi`);
      setModalVisible(false);
      fetchVehicles(); // Ro'yxatni yangilash
      setPendingChanges(prev => new Set([...prev, selectedVehicle.id]));
      
    } catch (error) {
      console.error('Error saving not working status:', error);
      message.error('Ma\'lumot saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  // Mavjud ma'lumotni tahrirlash
  const handleEditStatus = (vehicle) => {
    const workStatus = vehicle.work_status?.[0];
    if (!workStatus) return;

    setSelectedVehicle(vehicle);
    
    // Formni to'ldirish
    form.setFieldsValue({
      work_status: workStatus.work_status,
      reason_id: workStatus.reason_id,
      reason_details: workStatus.reason_details,
      start_time: workStatus.start_time ? moment(workStatus.start_time, 'HH:mm:ss') : null,
      end_time: workStatus.end_time ? moment(workStatus.end_time, 'HH:mm:ss') : null,
      notes: workStatus.notes
    });
    
    setModalVisible(true);
  };

  // Ma'lumotni yangilash
  const handleUpdateStatus = async (values) => {
    setSaving(true);
    try {
      await api.post('/daily-work-status', {
        vehicle_id: selectedVehicle.id,
        date: selectedDate.format('YYYY-MM-DD'),
        work_status: values.work_status,
        reason_id: values.work_status === 'not_working' ? values.reason_id : null,
        reason_details: values.work_status === 'not_working' ? values.reason_details : null,
        start_time: values.start_time ? values.start_time.format('HH:mm') : null,
        end_time: values.end_time ? values.end_time.format('HH:mm') : null,
        notes: values.notes
      });

      message.success(`${selectedVehicle.plate_number} - Ma'lumot yangilandi`);
      setModalVisible(false);
      fetchVehicles();
      setPendingChanges(prev => new Set([...prev, selectedVehicle.id]));
      
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('Ma\'lumot yangilashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  // Jadval ustunlari
  const columns = [
    {
      title: 'Texnika',
      key: 'vehicle',
      width: 200,
      render: (vehicle) => (
        <Space>
          <CarOutlined />
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {vehicle.plate_number}
            </div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              {vehicle.brand} {vehicle.model}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: 'Holat',
      key: 'status',
      width: 150,
      render: (vehicle) => {
        const workStatus = vehicle.work_status?.[0];
        if (!workStatus) {
          return <Tag color="default">Ma'lumot yo'q</Tag>;
        }
        
        const isWorking = workStatus.work_status === 'working';
        return (
          <Tag 
            color={isWorking ? 'green' : 'red'}
            icon={isWorking ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          >
            {isWorking ? 'Ishga chiqdi' : 'Ishga chiqmadi'}
          </Tag>
        );
      }
    },
    {
      title: 'Sabab',
      key: 'reason',
      width: 200,
      render: (vehicle) => {
        const workStatus = vehicle.work_status?.[0];
        if (!workStatus || workStatus.work_status === 'working') {
          return '-';
        }
        
        const reason = reasons.find(r => r.id === workStatus.reason_id);
        return (
          <div>
            <div>{reason?.name || 'Ko\'rsatilmagan'}</div>
            {workStatus.reason_details && (
              <div style={{ color: '#666', fontSize: '12px' }}>
                {workStatus.reason_details}
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Amallar',
      key: 'actions',
      width: 300,
      render: (vehicle) => {
        const workStatus = vehicle.work_status?.[0];
        const hasStatus = !!workStatus;
        const isConfirmed = workStatus?.status === 'confirmed';
        
        return (
          <Space wrap>
            {!hasStatus && (
              <>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleWorkingStatus(vehicle)}
                  loading={saving}
                  disabled={isConfirmed}
                >
                  Ishga chiqdi
                </Button>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleNotWorkingStatus(vehicle)}
                  loading={saving}
                  disabled={isConfirmed}
                >
                  Ishga chiqmadi
                </Button>
              </>
            )}
            
            {hasStatus && (
              <Button
                icon={<EditOutlined />}
                onClick={() => handleEditStatus(vehicle)}
                disabled={isConfirmed && !['super_admin', 'company_admin'].includes(user?.role?.name)}
              >
                Tahrirlash
              </Button>
            )}
            
            {isConfirmed && (
              <Tag color="green">Tasdiqlangan</Tag>
            )}
            
            {workStatus?.status === 'pending' && (
              <Tag color="orange">Tasdiqlanmagan</Tag>
            )}
          </Space>
        );
      }
    }
  ];

  // Barcha ma'lumotlarni tasdiqlash
  const handleConfirmAll = async () => {
    Modal.confirm({
      title: 'Barcha ma\'lumotlarni tasdiqlaysizmi?',
      content: 'Tasdiqlangandan keyin faqat adminlar o\'zgartira oladi.',
      onOk: async () => {
        // Bu yerda barcha pending holatidagi ma'lumotlarni tasdiqlash API chaqiruvi bo'ladi
        message.success('Barcha ma\'lumotlar tasdiqlandi');
      }
    });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <div>
              <Title level={3} style={{ margin: 0 }}>
                <CalendarOutlined /> Ma'lumot kiritish
              </Title>
              {user && (
                <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                  {user.role?.name === 'operator' && (
                    <span>Tuman: {user.district_access?.map(d => d.name).join(', ') || 'N/A'}</span>
                  )}
                  {user.role?.name === 'company_admin' && user.company && (
                    <span>Korxona: {user.company.name}</span>
                  )}
                  {user.role?.name === 'super_admin' && (
                    <span>Barcha korxonalar</span>
                  )}
                </div>
              )}
            </div>
          </Col>
          <Col>
            <Space>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                defaultValue={moment()}
                format="DD.MM.YYYY"
                placeholder="Sanani tanlang"
                style={{ width: 180 }}
                size="middle"
                allowClear={false}
                disabledDate={(current) => current && current > moment().endOf('day')}
                getPopupContainer={trigger => trigger.parentElement}
              />
              {pendingChanges.size > 0 && ['super_admin', 'company_admin'].includes(user?.role?.name) && (
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleConfirmAll}
                >
                  Barchasini tasdiqlash
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </div>

      {/* Operator uchun ma'lumot */}
      {user?.role?.name === 'operator' && (
        <Alert
          message="Ma'lumot kiritish"
          description="Har bir texnika uchun ishga chiqdi yoki chiqmadi tugmasini bosing. Kiritilgan ma'lumotlar admin tomonidan tasdiqlanishi kerak."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Texnikalar jadvali */}
      <Card title={`${selectedDate.format('DD.MM.YYYY')} sanasi uchun texnikalar`}>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={vehicles}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} / ${total} ta`
            }}
            scroll={{ x: 'max-content' }}
            locale={{
              emptyText: 'Texnikalar topilmadi'
            }}
          />
        </Spin>
      </Card>

      {/* Sabab kiritish modali */}
      <Modal
        title={selectedVehicle ? 
          `${selectedVehicle.plate_number} - Ma'lumot kiritish` : 
          'Ma\'lumot kiritish'
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={selectedVehicle?.work_status?.[0] ? handleUpdateStatus : handleSaveNotWorking}
        >
          <Form.Item
            name="work_status"
            label="Ish holati"
            rules={[{ required: true, message: 'Ish holatini tanlang' }]}
          >
            <Select placeholder="Ish holatini tanlang">
              <Option value="working">Ishga chiqdi</Option>
              <Option value="not_working">Ishga chiqmadi</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.work_status !== currentValues.work_status
            }
          >
            {({ getFieldValue }) => {
              const workStatus = getFieldValue('work_status');
              
              if (workStatus === 'not_working') {
                return (
                  <>
                    <Form.Item
                      name="reason_id"
                      label="Sabab"
                      rules={[{ required: true, message: 'Sababni tanlang' }]}
                    >
                      <Select placeholder="Sababni tanlang" showSearch>
                        {reasons.map(reason => (
                          <Option key={reason.id} value={reason.id}>
                            <div>
                              <div>{reason.name}</div>
                              <div style={{ color: '#666', fontSize: '12px' }}>
                                {reason.category}
                              </div>
                            </div>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="reason_details"
                      label="Sabab haqida batafsil"
                    >
                      <TextArea 
                        rows={3}
                        placeholder="Sabab haqida qo'shimcha ma'lumot..."
                      />
                    </Form.Item>
                  </>
                );
              }
              
              if (workStatus === 'working') {
                return (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="start_time"
                        label="Ishni boshlash vaqti"
                      >
                        <TimePicker 
                          style={{ width: '100%' }}
                          format="HH:mm"
                          placeholder="08:00"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="end_time"
                        label="Ishni tugatish vaqti"
                      >
                        <TimePicker 
                          style={{ width: '100%' }}
                          format="HH:mm"
                          placeholder="18:00"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                );
              }
              
              return null;
            }}
          </Form.Item>

          <Form.Item
            name="notes"
            label="Qo'shimcha izoh"
          >
            <TextArea 
              rows={2}
              placeholder="Qo'shimcha izohlar..."
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={saving}
              >
                Saqlash
              </Button>
              <Button 
                onClick={() => setModalVisible(false)}
              >
                Bekor qilish
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DailyWorkStatusEntry;
