import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Descriptions, 
  Button, 
  Space, 
  Image, 
  Tag, 
  Table, 
  Typography,
  Row,
  Col,
  Divider,
  message,
  Spin
} from 'antd';
import { 
  ArrowLeftOutlined, 
  EditOutlined,
  PrinterOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';
import moment from 'moment';
import api from '../../services/api';

const { Title } = Typography;

const TripSheetView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tripSheet, setTripSheet] = useState(null);

  useEffect(() => {
    loadTripSheet();
  }, [id]);

  const loadTripSheet = async () => {
    try {
      const response = await api.get(`/trip-sheets/${id}`);
      setTripSheet(response.data.data);
    } catch (error) {
      console.error('Error loading trip sheet:', error);
      message.error('Yo\'l varaqasini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate('/data-entry/trip-sheet-form', {
      state: { 
        tripSheetId: tripSheet.id,
        vehicleId: tripSheet.vehicle_id 
      }
    });
  };

  const handleBack = () => {
    navigate('/data-entry/206-report');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!tripSheet) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <p>Yo'l varaqasi topilmadi</p>
        <Button onClick={handleBack}>Orqaga</Button>
      </div>
    );
  }

  const loads = tripSheet.loads || [];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            Orqaga
          </Button>
          <Button icon={<EditOutlined />} type="primary" onClick={handleEdit}>
            Tahrirlash
          </Button>
          <Button icon={<PrinterOutlined />}>
            Chop etish
          </Button>
        </Space>
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card 
            title={
              <Space>
                <Title level={4} style={{ margin: 0 }}>
                  Yo'l varaqasi #{tripSheet.trip_number || tripSheet.id}
                </Title>
                <Tag color={tripSheet.status === 'approved' ? 'green' : 'orange'}>
                  {tripSheet.status === 'approved' ? 'Tasdiqlangan' : 'Kutilmoqda'}
                </Tag>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Descriptions column={2}>
              <Descriptions.Item label="Sana">
                {moment(tripSheet.date).format('DD.MM.YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Texnika">
                {tripSheet.vehicle?.plate_number} 
                ({tripSheet.vehicle?.brand} {tripSheet.vehicle?.model})
              </Descriptions.Item>
              <Descriptions.Item label="Haydovchi">
                {tripSheet.driver?.first_name} {tripSheet.driver?.last_name}
              </Descriptions.Item>
              <Descriptions.Item label="Yuk ortuvchi 1">
                {tripSheet.loader1?.first_name} {tripSheet.loader1?.last_name}
              </Descriptions.Item>
              <Descriptions.Item label="Yuk ortuvchi 2">
                {tripSheet.loader2?.first_name || 'Tayinlanmagan'} {tripSheet.loader2?.last_name || ''}
              </Descriptions.Item>
              <Descriptions.Item label="Zapravka">
                {tripSheet.fuel_station?.name}
              </Descriptions.Item>
            </Descriptions>

            <Divider>Spidometr ma'lumotlari</Divider>
            <Descriptions column={3}>
              <Descriptions.Item label="Kun boshi (km)">
                {tripSheet.odometer_start?.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Kun oxiri (km)">
                {tripSheet.odometer_end?.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Yurgan masofa (km)">
                {(tripSheet.odometer_end - tripSheet.odometer_start)?.toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <Divider>Yoqilg'i ma'lumotlari</Divider>
            <Descriptions column={2}>
              <Descriptions.Item label="Kun boshida qoldiq (l)">
                {tripSheet.fuel_start}
              </Descriptions.Item>
              <Descriptions.Item label="Olingan yoqilg'i (l)">
                {tripSheet.fuel_refilled}
              </Descriptions.Item>
              <Descriptions.Item label="Haqiqiy sarfiyot (l)">
                {tripSheet.fuel_consumption_actual}
              </Descriptions.Item>
              <Descriptions.Item label="Kun oxirida qoldiq (l)">
                {tripSheet.fuel_end}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {loads.length > 0 && (
            <Card title="Yuk ma'lumotlari" style={{ marginBottom: 16 }}>
              <Table
                dataSource={loads}
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Chiqindixona',
                    dataIndex: 'disposal_site_name',
                    key: 'disposal_site'
                  },
                  {
                    title: 'Jo\'nalishlar',
                    dataIndex: 'trips_count',
                    key: 'trips'
                  },
                  {
                    title: 'TBO (m³)',
                    dataIndex: 'tbo_volume_m3',
                    key: 'tbo_volume'
                  },
                  {
                    title: 'TBO (t)',
                    dataIndex: 'tbo_weight_tn',
                    key: 'tbo_weight'
                  },
                  {
                    title: 'Smet (m³)',
                    dataIndex: 'smet_volume_m3',
                    key: 'smet_volume'
                  },
                  {
                    title: 'Smet (t)',
                    dataIndex: 'smet_weight_tn',
                    key: 'smet_weight'
                  }
                ]}
              />
            </Card>
          )}

          {tripSheet.notes && (
            <Card title="Izohlar" style={{ marginBottom: 16 }}>
              <p>{tripSheet.notes}</p>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          {tripSheet.photo_url && (
            <Card title="Kunlik rasim" style={{ marginBottom: 16 }}>
              <Image
                width="100%"
                src={tripSheet.photo_url}
                alt="Kunlik rasim"
                style={{ borderRadius: 8 }}
              />
            </Card>
          )}

          <Card title="Holat ma'lumotlari">
            <Descriptions column={1}>
              <Descriptions.Item label="Yaratilgan">
                {moment(tripSheet.created_at).format('DD.MM.YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Yuborgan">
                {tripSheet.submitted_by?.first_name} {tripSheet.submitted_by?.last_name}
              </Descriptions.Item>
              {tripSheet.approved_by && (
                <Descriptions.Item label="Tasdiqlagan">
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    {tripSheet.approved_by.first_name} {tripSheet.approved_by.last_name}
                  </Space>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Oxirgi o'zgarish">
                {moment(tripSheet.updated_at).format('DD.MM.YYYY HH:mm')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TripSheetView;
