import React from 'react';
import { DatePicker, ConfigProvider } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/uz-latn';
import uzUZ from '../../locales/uz_UZ';
import useDateStore from '../../stores/dateStore';

// O'zbek tili sozlamalari
// Avval locale yaratish yoki mavjudligini tekshirish
if (!moment.locales().includes('uz-latn')) {
  moment.defineLocale('uz-latn', {
    months: [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ],
    monthsShort: [
      'Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn',
      'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'
    ],
    weekdays: [
      'Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 
      'Payshanba', 'Juma', 'Shanba'
    ],
    weekdaysShort: ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'],
    weekdaysMin: ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'],
    week: {
      dow: 1, // Dushanba birinchi kun
      doy: 4
    },
    relativeTime: {
      future: '%s ichida',
      past: '%s oldin',
      s: 'soniya',
      ss: '%d soniya',
      m: 'bir daqiqa',
      mm: '%d daqiqa',
      h: 'bir soat',
      hh: '%d soat',
      d: 'bir kun',
      dd: '%d kun',
      M: 'bir oy',
      MM: '%d oy',
      y: 'bir yil',
      yy: '%d yil'
    }
  });
}



const GlobalDatePicker = () => {
  const { selectedDate, setSelectedDate } = useDateStore();

  // selectedDate ni moment object ga aylantirish
  const dateValue = selectedDate && moment.isMoment(selectedDate) 
    ? selectedDate 
    : moment(selectedDate || undefined);

  // Kelajak kunlarni taqiqlash
  const disabledDate = (current) => {
    return current && current.isAfter(moment().endOf('day'));
  };

  // Sana o'zgarishini boshqarish
  const handleDateChange = (date) => {
    if (date && moment.isMoment(date)) {
      setSelectedDate(date);
    } else if (date) {
      setSelectedDate(moment(date));
    } else {
      // Agar sana o'chirilsa, bugungi kunni qo'y
      setSelectedDate(moment());
    }
  };

  // Kalendar ochilganda stillarni qo'llash
  const onOpenChange = (open) => {
    if (open) {
      setTimeout(() => {
        // Kelajak kunlarini vizual ravishda o'chirish
        const cells = document.querySelectorAll('.ant-picker-cell');
        const today = moment();
        
        cells.forEach(cell => {
          const cellDate = cell.getAttribute('title');
          if (cellDate) {
            const date = moment(cellDate, 'YYYY-MM-DD');
            if (date.isAfter(today, 'day')) {
              cell.style.opacity = '0.4';
              cell.style.backgroundColor = '#f5f5f5';
            }
          }
        });
      }, 100);
    }
  };

  return (
    <ConfigProvider locale={uzUZ}>
      <DatePicker
        value={dateValue}
        onChange={handleDateChange}
        format="DD.MM.YYYY"
        disabledDate={disabledDate}
        allowClear={false}
        showToday={true}
        suffixIcon={<CalendarOutlined />}
        style={{ 
          width: 160,
          marginLeft: 12
        }}
        placeholder="Sana tanlang"
        onOpenChange={onOpenChange}
        renderExtraFooter={() => (
          <div 
            style={{ 
              textAlign: 'center', 
              padding: '8px',
              borderTop: '1px solid #f0f0f0',
              color: '#1890ff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onClick={() => handleDateChange(moment())}
          >
            Bugun: {moment().format('DD.MM.YYYY')}
          </div>
        )}
        // Kalendar popup pozitsiyasi
        getPopupContainer={(trigger) => trigger.parentElement}
        // Input readonly qilish
        inputReadOnly={false}
        // Bugungi kunni alohida belgilash
        cellRender={(current) => {
          const isToday = current.isSame(moment(), 'day');
          const isFuture = current.isAfter(moment(), 'day');
          
          return (
            <div 
              className="ant-picker-cell-inner"
              style={{
                backgroundColor: isToday ? '#e6f7ff' : 'transparent',
                border: isToday ? '1px solid #1890ff' : 'none',
                fontWeight: isToday ? 'bold' : 'normal',
                opacity: isFuture ? 0.4 : 1,
                cursor: isFuture ? 'not-allowed' : 'pointer'
              }}
            >
              {current.date()}
            </div>
          );
        }}
      />
    </ConfigProvider>
  );
};

export default GlobalDatePicker;
