import React from 'react';
import { Card, Typography, Alert } from 'antd';

const { Title } = Typography;

const Employees = () => {
  return (
    <div className="employees-page fade-in">
      <Title level={2}>Xodimlar</Title>
      
      <Alert
        message="Rivojlanish jarayonida"
        description="Xodimlar moduli - dashboard, xodimlar ro'yxati, KPI funksiyalari ishlab chiqilmoqda."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Card>
        <p>Bu modulda quyidagi funksiyalar bo'ladi:</p>
        <ul>
          <li>Xodimlar ro'yxati</li>
          <li>KPI ko'rsatkichlari</li>
          <li>Ish faoliyati tahlili</li>
          <li>Xodimlar statistikalari</li>
        </ul>
      </Card>
    </div>
  );
};

export default Employees;
