import React from 'react';
import { Tabs } from 'antd';
import PolygonManagement from './PolygonManagement';
import PolygonReports from './PolygonReports';

const { TabPane } = Tabs;

const Polygons = () => {
  return (
    <div style={{ padding: '20px' }}>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Poligonlar ro'yxati" key="1">
          <PolygonManagement />
        </TabPane>
        <TabPane tab="Hisobotlar" key="2">
          <PolygonReports />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Polygons;