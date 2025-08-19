import React from 'react';
import { Card, Typography, Alert } from 'antd';

const { Title } = Typography;

const Settings = () => {
  return (
    <div className="settings-page fade-in">
      <Title level={2}>Sozlamalar</Title>
      
      <Alert
        message="Rivojlanish jarayonida"
        description="Sozlamalar moduli - tizim konfiguratsiyasi funksiyalari ishlab chiqilmoqda."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Card>
        <p>Bu modulda quyidagi funksiyalar bo'ladi:</p>
        <ul>
          <li>Tizim parametrlari</li>
          <li>Foydalanuvchi sozlamalari</li>
          <li>Tariflar sozlash</li>
          <li>Tizim konfiguratsiyasi</li>
        </ul>
      </Card>
    </div>
  );
};

export default Settings;
