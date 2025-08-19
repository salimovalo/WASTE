import React from 'react';
import { Tabs, Typography } from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  DatabaseOutlined,
  PieChartOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import DailyWorkStatusEntry from './DailyWorkStatusEntry';
import DailyWorkStatusStatistics from './DailyWorkStatusStatistics';
import DailyWorkStatusSummary from './DailyWorkStatusSummary';
import WorkStatusReasons from './WorkStatusReasons';
import './DailyWorkStatus.css';

const { Title } = Typography;

// Asosiy DailyWorkStatus komponenti (Tab-based)
const DailyWorkStatus = () => {
  const tabItems = [
    {
      key: 'summary',
      label: (
        <span>
          <EnvironmentOutlined />
          Tumanlar bo'yicha
        </span>
      ),
      children: <DailyWorkStatusSummary />
    },
    {
      key: 'entry',
      label: (
        <span>
          <DatabaseOutlined />
          Ma'lumot kiritish
        </span>
      ),
      children: <DailyWorkStatusEntry />
    },
    {
      key: 'statistics',
      label: (
        <span>
          <PieChartOutlined />
          Statistika
        </span>
      ),
      children: <DailyWorkStatusStatistics />
    },
    {
      key: 'reasons',
      label: (
        <span>
          <ExclamationCircleOutlined />
          Sabablar
        </span>
      ),
      children: <WorkStatusReasons />
    }
  ];

  return (
    <div className="daily-work-status-page" style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        <CalendarOutlined /> Kunlik ma'lumot
      </Title>
      
      <Tabs 
        items={tabItems}
        defaultActiveKey="summary"
        size="large"
        tabBarStyle={{ 
          background: 'white',
          margin: 0,
          paddingLeft: '24px'
        }}
      />
    </div>
  );
};

export default DailyWorkStatus;