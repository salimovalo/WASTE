import React from 'react';
import { Card, Typography, Alert } from 'antd';

const { Title } = Typography;

const PhysicalPersons = () => {
  return (
    <div className="physical-persons-page fade-in">
      <Title level={2}>Jismoniy shaxslar</Title>
      
      <Alert
        message="Rivojlanish jarayonida"
        description="Jismoniy shaxslar moduli - dashboard, kunlik tushum, ma'lumot kiritish funksiyalari ishlab chiqilmoqda."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Card>
        <p>Bu modulda quyidagi funksiyalar bo'ladi:</p>
        <ul>
          <li>Dashboard - umumiy ko'rsatkichlar</li>
          <li>Kunlik tushum ma'lumotlari</li>
          <li>Ma'lumot kiritish formlari</li>
          <li>Tuman ma'lumotlari</li>
          <li>Tarixiy ma'lumotlar</li>
          <li>Xodimlar amallari</li>
        </ul>
      </Card>
    </div>
  );
};

export default PhysicalPersons;
