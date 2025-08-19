import React from 'react';
import { Card, Typography, Alert } from 'antd';

const { Title } = Typography;

const Reports = () => {
  return (
    <div className="reports-page fade-in">
      <Title level={2}>Xisobotlar</Title>
      
      <Alert
        message="Rivojlanish jarayonida"
        description="Xisobotlar moduli - barcha modullardan umumiy xisobotlar funksiyalari ishlab chiqilmoqda."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Card>
        <p>Bu modulda quyidagi funksiyalar bo'ladi:</p>
        <ul>
          <li>Moliyaviy xisobotlar</li>
          <li>Operatsion xisobotlar</li>
          <li>Sifat xisobotlari</li>
          <li>Export funksiyalari</li>
          <li>Grafik tahlillar</li>
        </ul>
      </Card>
    </div>
  );
};

export default Reports;
