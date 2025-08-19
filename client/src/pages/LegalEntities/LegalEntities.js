import React from 'react';
import { Card, Typography, Alert } from 'antd';

const { Title } = Typography;

const LegalEntities = () => {
  return (
    <div className="legal-entities-page fade-in">
      <Title level={2}>Yuridik shaxslar</Title>
      
      <Alert
        message="Rivojlanish jarayonida"
        description="Yuridik shaxslar moduli - shartnomalar, xisobotlar, kunlik tushum funksiyalari ishlab chiqilmoqda."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Card>
        <p>Bu modulda quyidagi funksiyalar bo'ladi:</p>
        <ul>
          <li>Shartnomalar jadvali</li>
          <li>Tarixiy ma'lumotlar</li>
          <li>Xisobotlar</li>
          <li>Kunlik tushum va reja grafigi</li>
        </ul>
      </Card>
    </div>
  );
};

export default LegalEntities;
