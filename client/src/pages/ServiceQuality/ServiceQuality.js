import React from 'react';
import { Card, Typography, Alert } from 'antd';

const { Title } = Typography;

const ServiceQuality = () => {
  return (
    <div className="service-quality-page fade-in">
      <Title level={2}>Xizmat sifati</Title>
      
      <Alert
        message="Rivojlanish jarayonida"
        description="Xizmat sifati moduli - maxallarga xizmat ko'rsatish, xajim boshqaruvi funksiyalari ishlab chiqilmoqda."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Card>
        <p>Bu modulda quyidagi funksiyalar bo'ladi:</p>
        <ul>
          <li>Maxallarga xizmat ko'rsatish</li>
          <li>Xajim boshqaruvi</li>
          <li>Sifat baholash</li>
          <li>Shikoyatlar boshqaruvi</li>
        </ul>
      </Card>
    </div>
  );
};

export default ServiceQuality;
