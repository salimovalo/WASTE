import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Table, 
  Row, 
  Col, 
  Statistic,
  Progress,
  Tag,
  Space,
  Collapse,
  Button,
  Select,
  Divider,
  Tooltip
} from 'antd';
import { 
  PieChartOutlined,
  BarChartOutlined,
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

const PivotTable = ({ pivotData }) => {
  const [groupBy, setGroupBy] = useState('district'); // district, company, month
  const [sortBy, setSortBy] = useState('total'); // total, working_percentage, not_working
  const [processedData, setProcessedData] = useState([]);

  useEffect(() => {
    processData();
  }, [pivotData, groupBy, sortBy]);

  const processData = () => {
    if (!pivotData || Object.keys(pivotData).length === 0) {
      setProcessedData([]);
      return;
    }

    let data = [];

    if (groupBy === 'district') {
      data = Object.entries(pivotData).map(([district, stats]) => ({
        key: district,
        name: district,
        type: 'Tuman',
        ...stats,
        working_percentage: stats.total > 0 ? Math.round((stats.working / stats.total) * 100) : 0
      }));
    } else if (groupBy === 'company') {
      const companyData = {};
      Object.entries(pivotData).forEach(([district, stats]) => {
        Object.entries(stats.companies || {}).forEach(([company, companyStats]) => {
          if (!companyData[company]) {
            companyData[company] = {
              total: 0,
              working: 0,
              not_working: 0,
              districts: new Set(),
              vehicles: new Set(),
              reasons: {}
            };
          }
          companyData[company].total += companyStats.working + companyStats.not_working;
          companyData[company].working += companyStats.working;
          companyData[company].not_working += companyStats.not_working;
          companyData[company].districts.add(district);
          
          // Sabablarni qo'shish
          Object.entries(stats.reasons || {}).forEach(([reason, count]) => {
            companyData[company].reasons[reason] = (companyData[company].reasons[reason] || 0) + count;
          });
        });
      });

      data = Object.entries(companyData).map(([company, stats]) => ({
        key: company,
        name: company,
        type: 'Korxona',
        ...stats,
        working_percentage: stats.total > 0 ? Math.round((stats.working / stats.total) * 100) : 0,
        districts_count: stats.districts.size
      }));
    } else if (groupBy === 'month') {
      const monthData = {};
      Object.entries(pivotData).forEach(([district, stats]) => {
        Object.entries(stats.monthly || {}).forEach(([month, monthStats]) => {
          if (!monthData[month]) {
            monthData[month] = {
              total: 0,
              working: 0,
              not_working: 0,
              districts: new Set()
            };
          }
          monthData[month].total += monthStats.working + monthStats.not_working;
          monthData[month].working += monthStats.working;
          monthData[month].not_working += monthStats.not_working;
          monthData[month].districts.add(district);
        });
      });

      data = Object.entries(monthData).map(([month, stats]) => ({
        key: month,
        name: moment(month).format('MMMM YYYY'),
        type: 'Oy',
        ...stats,
        working_percentage: stats.total > 0 ? Math.round((stats.working / stats.total) * 100) : 0,
        districts_count: stats.districts.size
      }));
    }

    // Saralash
    data.sort((a, b) => {
      if (sortBy === 'total') return b.total - a.total;
      if (sortBy === 'working_percentage') return b.working_percentage - a.working_percentage;
      if (sortBy === 'not_working') return b.not_working - a.not_working;
      return a.name.localeCompare(b.name);
    });

    setProcessedData(data);
  };

  const renderReasonsList = (reasons) => {
    if (!reasons || Object.keys(reasons).length === 0) {
      return <Tag color="green">Sabablar yo'q</Tag>;
    }

    const sortedReasons = Object.entries(reasons)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    return (
      <Space direction="vertical" size="small">
        {sortedReasons.map(([reason, count]) => (
          <Tag key={reason} color="orange">
            {reason}: {count}
          </Tag>
        ))}
      </Space>
    );
  };

  const columns = [
    {
      title: groupBy === 'district' ? 'Tuman' : groupBy === 'company' ? 'Korxona' : 'Oy',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (name, record) => (
        <Space>
          <Text strong>{name}</Text>
          <Tag color="blue" size="small">{record.type}</Tag>
        </Space>
      )
    },
    {
      title: 'Jami yozuvlar',
      dataIndex: 'total',
      key: 'total',
      width: 120,
      align: 'center',
      render: (total) => (
        <Statistic
          value={total}
          valueStyle={{ fontSize: '16px' }}
          prefix={<CarOutlined />}
        />
      ),
      sorter: (a, b) => a.total - b.total
    },
    {
      title: 'Ishga chiqdi',
      dataIndex: 'working',
      key: 'working',
      width: 120,
      align: 'center',
      render: (working) => (
        <Tag color="green" icon={<CheckCircleOutlined />}>
          {working}
        </Tag>
      ),
      sorter: (a, b) => a.working - b.working
    },
    {
      title: 'Ishga chiqmadi',
      dataIndex: 'not_working',
      key: 'not_working',
      width: 130,
      align: 'center',
      render: (notWorking) => (
        <Tag color="red" icon={<CloseCircleOutlined />}>
          {notWorking}
        </Tag>
      ),
      sorter: (a, b) => a.not_working - b.not_working
    },
    {
      title: 'Ishlash foizi',
      dataIndex: 'working_percentage',
      key: 'working_percentage',
      width: 150,
      render: (percentage) => (
        <Progress
          percent={percentage}
          size="small"
          status={
            percentage >= 85 ? 'success' :
            percentage >= 75 ? 'normal' : 'exception'
          }
          format={(percent) => `${percent}%`}
        />
      ),
      sorter: (a, b) => a.working_percentage - b.working_percentage
    }
  ];

  // Texnikalar soni ustuni (faqat tuman va korxona uchun)
  if (groupBy === 'district') {
    columns.splice(-1, 0, {
      title: 'Texnikalar soni',
      dataIndex: 'vehicles_count',
      key: 'vehicles_count',
      width: 130,
      align: 'center',
      render: (count) => (
        <Tooltip title="Noyob texnikalar soni">
          <Tag color="purple">{count}</Tag>
        </Tooltip>
      )
    });
  }

  if (groupBy === 'company') {
    columns.splice(-1, 0, {
      title: 'Tumanlar soni',
      dataIndex: 'districts_count',
      key: 'districts_count',
      width: 120,
      align: 'center',
      render: (count) => (
        <Tag color="geekblue">{count}</Tag>
      )
    });
  }

  // Sabablar ustuni (tuman va korxona uchun)
  if (groupBy !== 'month') {
    columns.push({
      title: 'Asosiy sabablar',
      dataIndex: 'reasons',
      key: 'reasons',
      width: 200,
      render: (reasons) => renderReasonsList(reasons)
    });
  }

  const totalStats = processedData.reduce((acc, item) => {
    acc.total += item.total;
    acc.working += item.working;
    acc.not_working += item.not_working;
    return acc;
  }, { total: 0, working: 0, not_working: 0 });

  const avgWorkingPercentage = totalStats.total > 0 ? 
    Math.round((totalStats.working / totalStats.total) * 100) : 0;

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <PieChartOutlined /> Yeg'indi jadval
            </Title>
          </Col>
          <Col>
            <Space>
              <Select
                value={groupBy}
                onChange={setGroupBy}
                style={{ width: 120 }}
              >
                <Option value="district">Tuman bo'yicha</Option>
                <Option value="company">Korxona bo'yicha</Option>
                <Option value="month">Oy bo'yicha</Option>
              </Select>
              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: 140 }}
              >
                <Option value="total">Jami yozuvlar</Option>
                <Option value="working_percentage">Ishlash foizi</Option>
                <Option value="not_working">Ishlamagan kunlar</Option>
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Umumiy yeg'indi */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={6}>
            <Statistic
              title="Jami yozuvlar"
              value={totalStats.total}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="Ishga chiqdi"
              value={totalStats.working}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="Ishga chiqmadi"
              value={totalStats.not_working}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="O'rtacha ishlash foizi"
              value={avgWorkingPercentage}
              suffix="%"
              prefix={<PieChartOutlined />}
              valueStyle={{ 
                color: avgWorkingPercentage >= 85 ? '#52c41a' : 
                       avgWorkingPercentage >= 75 ? '#faad14' : '#ff4d4f' 
              }}
            />
          </Col>
        </Row>
      </Card>

      {/* Batafsil jadval */}
      <Card>
        <Table
          columns={columns}
          dataSource={processedData}
          rowKey="key"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} / ${total} ta`,
          }}
          scroll={{ x: 'max-content' }}
          expandable={
            groupBy === 'district' ? {
              expandedRowRender: (record) => {
                const companies = Object.entries(
                  Object.values(pivotData).find(data => 
                    Object.keys(data.companies || {}).length > 0
                  )?.companies || {}
                );

                if (companies.length === 0) {
                  return <Text type="secondary">Korxona ma'lumotlari yo'q</Text>;
                }

                return (
                  <Table
                    size="small"
                    dataSource={companies.map(([company, stats]) => ({
                      key: company,
                      company,
                      ...stats,
                      total: stats.working + stats.not_working
                    }))}
                    columns={[
                      {
                        title: 'Korxona',
                        dataIndex: 'company',
                        key: 'company'
                      },
                      {
                        title: 'Ishga chiqdi',
                        dataIndex: 'working',
                        key: 'working',
                        render: (val) => <Tag color="green">{val}</Tag>
                      },
                      {
                        title: 'Ishga chiqmadi',
                        dataIndex: 'not_working',
                        key: 'not_working',
                        render: (val) => <Tag color="red">{val}</Tag>
                      },
                      {
                        title: 'Jami',
                        dataIndex: 'total',
                        key: 'total'
                      }
                    ]}
                    pagination={false}
                  />
                );
              },
              rowExpandable: () => true,
            } : undefined
          }
        />
      </Card>
    </div>
  );
};

export default PivotTable;
