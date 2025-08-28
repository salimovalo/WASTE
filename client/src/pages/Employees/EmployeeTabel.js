import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Typography, 
  DatePicker,
  Select,
  Button,
  Space,
  Tag,
  Statistic,
  Row,
  Col,
  Avatar,
  Progress,
  message
} from 'antd';
import { 
  CalendarOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  PrinterOutlined,
  TruckOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import moment from 'moment';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import './EmployeeTabel.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const EmployeeTabel = () => {
  const { employeeId } = useParams();
  const [loading, setLoading] = useState(false);
  const [tabelData, setTabelData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(employeeId || 'all');
  const [selectedMonth, setSelectedMonth] = useState(moment());
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const { user } = useAuthStore();

  useEffect(() => {
    loadEmployees();
  }, [user]);

  useEffect(() => {
    loadTabelData();
  }, [selectedEmployee, selectedMonth, categoryFilter]);

  const loadEmployees = async () => {
    try {
      const response = await api.get('/employees', {
        params: { 
          company_id: user.company_id,
          district_id: user.district_id,
          is_active: true 
        }
      });
      
      // Mock employees data
      const mockEmployees = [
        {
          id: 1,
          first_name: 'Karim',
          last_name: 'Ahmedov',
          position: 'driver',
          position_name: 'Haydovchi',
          vehicle_number: '01A123BC'
        },
        {
          id: 2,
          first_name: 'Bobur',
          last_name: 'Toshmatov',
          position: 'loader',
          position_name: 'Yuk ortuvchi',
          vehicle_number: '01A123BC'
        },
        {
          id: 3,
          first_name: 'Islom',
          last_name: 'Ibrohimov',
          position: 'driver',
          position_name: 'Haydovchi',
          vehicle_number: '01B456DE'
        },
        {
          id: 4,
          first_name: 'Aziz',
          last_name: 'Karimov',
          position: 'loader',
          position_name: 'Yuk ortuvchi',
          vehicle_number: '01B456DE'
        }
      ];
      
      setEmployees(mockEmployees);
      
    } catch (error) {
      console.error('Error loading employees:', error);
      message.error('Xodimlar ro\'yxatini yuklashda xatolik');
    }
  };

  const loadTabelData = async () => {
    try {
      setLoading(true);
      
      // Mock tabel data based on 206 reports
      const monthStart = selectedMonth.clone().startOf('month');
      const monthEnd = selectedMonth.clone().endOf('month');
      const daysInMonth = monthEnd.date();
      
      const tabelEntries = [];
      
      const filteredEmployees = employees.filter(emp => {
        if (selectedEmployee !== 'all' && emp.id !== parseInt(selectedEmployee)) return false;
        if (categoryFilter !== 'all' && emp.position !== categoryFilter) return false;
        return true;
      });
      
      filteredEmployees.forEach(employee => {
        for (let day = 1; day <= daysInMonth; day++) {
          const currentDate = monthStart.clone().date(day);
          const isWeekend = currentDate.day() === 0 || currentDate.day() === 6;
          const isPast = currentDate.isBefore(moment(), 'day');
          
          // Simulate work data from 206 reports
          let status = 'absent';
          let hours = 0;
          let vehicle_used = null;
          
          if (!isWeekend && isPast && Math.random() > 0.1) { // 90% attendance on working days
            status = 'present';
            hours = 8; // Standard 8-hour workday
            vehicle_used = employee.vehicle_number;
          } else if (isWeekend) {
            status = 'weekend';
          } else if (Math.random() > 0.95) { // 5% sick days
            status = 'sick';
          }
          
          tabelEntries.push({
            key: `${employee.id}-${day}`,
            employee_id: employee.id,
            employee_name: `${employee.first_name} ${employee.last_name}`,
            position: employee.position,
            position_name: employee.position_name,
            date: currentDate.format('YYYY-MM-DD'),
            day: day,
            day_name: currentDate.format('dd'),
            status: status,
            hours: hours,
            vehicle_used: vehicle_used,
            from_206: status === 'present', // Indicates data came from 206 report
            is_weekend: isWeekend,
            is_past: isPast
          });
        }
      });
      
      setTabelData(tabelEntries);
      
    } catch (error) {
      console.error('Error loading tabel data:', error);
      message.error('Tabel ma\'lumotlarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'green';
      case 'absent': return 'red';
      case 'sick': return 'orange';
      case 'weekend': return 'blue';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'present': return 'Ishda';
      case 'absent': return 'Yo\'q';
      case 'sick': return 'Kasallik';
      case 'weekend': return 'Dam';
      default: return 'Noma\'lum';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircleOutlined />;
      case 'absent': return <CloseCircleOutlined />;
      case 'sick': return <ExclamationCircleOutlined />;
      case 'weekend': return <CalendarOutlined />;
      default: return <ExclamationCircleOutlined />;
    }
  };

  // Create calendar view data
  const createCalendarData = () => {
    const monthStart = selectedMonth.clone().startOf('month');
    const daysInMonth = monthStart.daysInMonth();
    
    const calendarData = [];
    
    const filteredEmployees = employees.filter(emp => {
      if (selectedEmployee !== 'all' && emp.id !== parseInt(selectedEmployee)) return false;
      if (categoryFilter !== 'all' && emp.position !== categoryFilter) return false;
      return true;
    });
    
    filteredEmployees.forEach(employee => {
      const employeeRow = {
        key: employee.id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        position_name: employee.position_name,
        position: employee.position,
        vehicle_number: employee.vehicle_number,
        days: {}
      };
      
      // Calculate statistics
      let presentDays = 0;
      let absentDays = 0;
      let sickDays = 0;
      let totalHours = 0;
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dayData = tabelData.find(entry => 
          entry.employee_id === employee.id && entry.day === day
        );
        
        if (dayData) {
          employeeRow.days[day] = dayData;
          
          if (dayData.status === 'present') {
            presentDays++;
            totalHours += dayData.hours;
          } else if (dayData.status === 'absent') {
            absentDays++;
          } else if (dayData.status === 'sick') {
            sickDays++;
          }
        }
      }
      
      employeeRow.present_days = presentDays;
      employeeRow.absent_days = absentDays;
      employeeRow.sick_days = sickDays;
      employeeRow.total_hours = totalHours;
      employeeRow.attendance_rate = presentDays > 0 ? ((presentDays / (presentDays + absentDays + sickDays)) * 100) : 0;
      
      calendarData.push(employeeRow);
    });
    
    return calendarData;
  };

  const calendarData = createCalendarData();

  // Generate day columns for the calendar
  const monthStart = selectedMonth.clone().startOf('month');
  const daysInMonth = monthStart.daysInMonth();
  
  const dayColumns = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = monthStart.clone().date(day);
    const isWeekend = currentDate.day() === 0 || currentDate.day() === 6;
    
    dayColumns.push({
      title: (
        <div style={{ 
          textAlign: 'center',
          color: isWeekend ? '#fa8c16' : '#000',
          fontWeight: isWeekend ? 'bold' : 'normal'
        }}>
          <div>{day}</div>
          <div style={{ fontSize: '10px' }}>{currentDate.format('dd')}</div>
        </div>
      ),
      dataIndex: ['days', day],
      key: `day_${day}`,
      width: 40,
      align: 'center',
      render: (dayData) => {
        if (!dayData) return <span>-</span>;
        
        const cellStyle = {
          width: '100%',
          height: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold'
        };
        
        if (dayData.status === 'present') {
          cellStyle.backgroundColor = '#f6ffed';
          cellStyle.border = '1px solid #52c41a';
          cellStyle.color = '#52c41a';
          return (
            <div style={cellStyle} title={`Ishda: ${dayData.hours} soat (${dayData.vehicle_used || 'Texnika ko\'rsatilmagan'})`}>
              {dayData.from_206 ? '206' : '✓'}
            </div>
          );
        } else if (dayData.status === 'absent') {
          cellStyle.backgroundColor = '#fff2f0';
          cellStyle.border = '1px solid #ff4d4f';
          cellStyle.color = '#ff4d4f';
          return <div style={cellStyle} title="Yo'q">✗</div>;
        } else if (dayData.status === 'sick') {
          cellStyle.backgroundColor = '#fff7e6';
          cellStyle.border = '1px solid #fa8c16';
          cellStyle.color = '#fa8c16';
          return <div style={cellStyle} title="Kasallik">К</div>;
        } else if (dayData.status === 'weekend') {
          cellStyle.backgroundColor = '#f0f0f0';
          cellStyle.border = '1px solid #d9d9d9';
          cellStyle.color = '#8c8c8c';
          return <div style={cellStyle} title="Dam kuni">Д</div>;
        }
        
        return <span>-</span>;
      }
    });
  }

  const columns = [
    {
      title: 'Xodim',
      key: 'employee',
      fixed: 'left',
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar 
            icon={record.position === 'driver' ? <UserOutlined /> : <TruckOutlined />}
            style={{ 
              backgroundColor: record.position === 'driver' ? '#1890ff' : '#52c41a' 
            }}
          />
          <div>
            <Text strong>{record.employee_name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.position_name}
            </Text>
            {record.vehicle_number && (
              <>
                <br />
                <Text type="secondary" style={{ fontSize: 10 }}>
                  {record.vehicle_number}
                </Text>
              </>
            )}
          </div>
        </Space>
      )
    },
    ...dayColumns,
    {
      title: 'Statistika',
      key: 'stats',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <Text style={{ fontSize: 12 }}>Ishda: </Text>
            <Text strong style={{ color: '#52c41a', fontSize: 12 }}>{record.present_days}</Text>
          </div>
          <div style={{ marginBottom: 4 }}>
            <Text style={{ fontSize: 12 }}>Yo'q: </Text>
            <Text strong style={{ color: '#ff4d4f', fontSize: 12 }}>{record.absent_days}</Text>
          </div>
          <div style={{ marginBottom: 4 }}>
            <Text style={{ fontSize: 12 }}>Soatlar: </Text>
            <Text strong style={{ fontSize: 12 }}>{record.total_hours}</Text>
          </div>
          <Progress 
            percent={record.attendance_rate} 
            size="small" 
            strokeColor="#52c41a"
            showInfo={false}
          />
          <Text style={{ fontSize: 10 }}>{record.attendance_rate.toFixed(1)}% davomat</Text>
        </div>
      )
    }
  ];

  const exportToExcel = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/employees/tabel/export', {
        params: {
          month: selectedMonth.format('YYYY-MM'),
          employee_id: selectedEmployee !== 'all' ? selectedEmployee : undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined
        },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tabel_${selectedMonth.format('YYYY-MM')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('Excel fayl yuklandi!');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Export qilishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const totalEmployees = calendarData.length;
  const totalPresentDays = calendarData.reduce((sum, emp) => sum + emp.present_days, 0);
  const totalAbsentDays = calendarData.reduce((sum, emp) => sum + emp.absent_days, 0);
  const totalHours = calendarData.reduce((sum, emp) => sum + emp.total_hours, 0);
  const avgAttendance = calendarData.length > 0 ? 
    (calendarData.reduce((sum, emp) => sum + emp.attendance_rate, 0) / calendarData.length) : 0;

  return (
    <div className="employee-tabel">
      <Card className="header-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
              <CalendarOutlined /> Xodimlar tabeli
            </Title>
            <Text type="secondary">
              206 xisobotidan avtomatik olingan davomat ma'lumotlari
            </Text>
          </div>
          
          <Space>
            <DatePicker
              value={selectedMonth}
              onChange={setSelectedMonth}
              picker="month"
              format="MM.YYYY"
              placeholder="Oy tanlang"
            />
            <Button 
              icon={<FileExcelOutlined />}
              onClick={exportToExcel}
              loading={loading}
            >
              Excel export
            </Button>
            <Button 
              icon={<PrinterOutlined />}
              onClick={() => window.print()}
            >
              Chop etish
            </Button>
          </Space>
        </div>

        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Select
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              style={{ width: '100%' }}
              placeholder="Xodimni tanlang"
            >
              <Option value="all">Barcha xodimlar</Option>
              {employees.map(emp => (
                <Option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} - {emp.position_name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={8}>
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: '100%' }}
              placeholder="Kategoriya"
            >
              <Option value="all">Barcha kategoriya</Option>
              <Option value="driver">Haydovchilar</Option>
              <Option value="loader">Yuk ortuvchilar</Option>
            </Select>
          </Col>
        </Row>

        {/* Summary Statistics */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic title="Jami xodimlar" value={totalEmployees} />
          </Col>
          <Col span={6}>
            <Statistic title="Jami ishda" value={totalPresentDays} valueStyle={{ color: '#52c41a' }} />
          </Col>
          <Col span={6}>
            <Statistic title="Jami soatlar" value={totalHours} valueStyle={{ color: '#1890ff' }} />
          </Col>
          <Col span={6}>
            <Statistic title="O'rtacha davomat" value={avgAttendance} precision={1} suffix="%" valueStyle={{ color: '#722ed1' }} />
          </Col>
        </Row>
      </Card>

      <Card title={`${selectedMonth.format('MMMM YYYY')} - Tabel kalendari`}>
        <div style={{ marginBottom: 16, fontSize: 12 }}>
          <Space size="large">
            <span><span style={{ color: '#52c41a' }}>206</span> - 206 xisobotidan olingan</span>
            <span><span style={{ color: '#52c41a' }}>✓</span> - Ishda</span>
            <span><span style={{ color: '#ff4d4f' }}>✗</span> - Yo'q</span>
            <span><span style={{ color: '#fa8c16' }}>К</span> - Kasallik</span>
            <span><span style={{ color: '#8c8c8c' }}>Д</span> - Dam kuni</span>
          </Space>
        </div>
        
        <Table
          columns={columns}
          dataSource={calendarData}
          loading={loading}
          pagination={false}
          scroll={{ x: 1500, y: 600 }}
          size="small"
          bordered
          className="tabel-calendar"
        />
      </Card>
    </div>
  );
};

export default EmployeeTabel;
