import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Button, message, Space } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import TripSheetForm from './TripSheetForm';
import api from '../../services/api';

const TripSheetFormPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    // Location state'dan ma'lumotlarni olish
    const { vehicleId, tripSheetId, date, vehicle } = location.state || {};
    
    if (tripSheetId) {
      // Mavjud trip sheet'ni tahrirlash
      loadTripSheet(tripSheetId);
    } else if (vehicleId) {
      // Yangi trip sheet yaratish
      setInitialData({
        vehicle_id: vehicleId,
        date: date,
        vehicle: vehicle
      });
    }
  }, [location.state]);

  const loadTripSheet = async (tripSheetId) => {
    try {
      const response = await api.get(`/trip-sheets/${tripSheetId}`);
      setInitialData(response.data.data);
    } catch (error) {
      console.error('Error loading trip sheet:', error);
      message.error('Yo\'l varaqasini yuklashda xatolik');
    }
  };

  const handleSubmit = (data) => {
    message.success('Yo\'l varaqasi muvaffaqiyatli saqlandi!');
    navigate('/data-entry/206-report');
  };

  const handleBack = () => {
    navigate('/data-entry/206-report');
  };

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
          >
            Orqaga qaytish
          </Button>
          
          <div style={{ marginLeft: 16 }}>
            <h3 style={{ margin: 0 }}>
              {initialData?.id ? 'Yo\'l varaqasini tahrirlash' : 'Yangi yo\'l varaqasi'}
            </h3>
            {location.state?.vehicle && (
              <p style={{ margin: 0, color: '#666' }}>
                Texnika: {location.state.vehicle.brand} {location.state.vehicle.model} 
                ({location.state.vehicle.plate_number})
              </p>
            )}
          </div>
        </Space>
      </Card>

      <TripSheetForm
        vehicleId={location.state?.vehicleId}
        initialData={initialData}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default TripSheetFormPage;
