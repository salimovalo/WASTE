import moment from 'moment';

// Global sana taqiqlash funksiyasi - kelajakdagi kunlarni taqiqlaydi
export const disableFutureDates = (current) => {
  return current && current.isAfter(moment().endOf('day'));
};

// Default bugungi sanani qaytaradi
export const getDefaultDate = () => {
  return moment();
};

// Sanani validatsiya qiladi (bugungi kundan oshmasligi kerak)
export const isValidDate = (date) => {
  // Moment objectga aylantirish
  const momentDate = moment.isMoment(date) ? date : moment(date);
  return momentDate.isValid() && momentDate.isSameOrBefore(moment(), 'day');
};

// Sana o'zgarishini handle qiladi - kun tanlanganda data yuklash uchun
export const handleDateChange = (date, setDate, onDateChange) => {
  // Agar date null yoki undefined bo'lsa, bugungi sanani qo'y
  if (!date) {
    setDate(moment());
    if (onDateChange) {
      onDateChange(moment());
    }
    return;
  }

  // Moment objectga aylantirish
  const momentDate = moment.isMoment(date) ? date : moment(date);

  // Agar kelajakdagi sana bo'lsa, bugungi sanaga o'tkazadi
  if (!momentDate.isValid() || momentDate.isAfter(moment(), 'day')) {
    setDate(moment());
    if (onDateChange) {
      onDateChange(moment());
    }
  } else {
    setDate(momentDate);
    if (onDateChange) {
      onDateChange(momentDate);
    }
  }
};

// Sana formatini qaytaradi
export const getDateFormat = () => 'DD.MM.YYYY';

// Kalendar cell stillarini boshqarish
export const updateCalendarCellStyles = (open) => {
  if (open) {
    setTimeout(() => {
      const dropdown = document.querySelector('.ant-picker-dropdown');
      if (!dropdown) return;

      // Kalendardagi barcha kunlarni tekshirish
      const cells = dropdown.querySelectorAll('td.ant-picker-cell');
      const today = moment();
      
      cells.forEach(cell => {
        const cellDate = cell.getAttribute('title');
        if (!cellDate) return;
        
        const date = moment(cellDate, 'YYYY-MM-DD');
        
        // Kelajak kunlarini disabled qilish va o'chiq ko'rsatish
        if (date.isAfter(today, 'day')) {
          cell.classList.add('ant-picker-cell-disabled');
          const inner = cell.querySelector('.ant-picker-cell-inner');
          if (inner) {
            inner.style.color = '#d9d9d9';
            inner.style.backgroundColor = '#f5f5f5';
            inner.style.cursor = 'not-allowed';
            inner.style.opacity = '0.5';
          }
          // Click event ni o'chirish
          cell.style.pointerEvents = 'none';
        } else {
          // Tarixiy kunlar va bugungi kun aktiv
          const inner = cell.querySelector('.ant-picker-cell-inner');
          if (inner) {
            inner.style.cursor = 'pointer';
            // Bugungi kunni alohida belgilash
            if (date.isSame(today, 'day')) {
              inner.style.fontWeight = 'bold';
              inner.style.backgroundColor = '#e6f7ff';
              inner.style.border = '1px solid #1890ff';
            }
          }
        }
      });
    }, 50);
  }
};

// Standart kalendar sozlamalari
export const getStandardCalendarProps = () => ({
  showToday: true,
  format: getDateFormat(),
  disabledDate: disableFutureDates,
  allowClear: false,
  inputReadOnly: false,
  placeholder: "Sanani tanlang",
  onOpenChange: updateCalendarCellStyles,
  defaultValue: getDefaultDate(),
  locale: {
    lang: {
      locale: 'uz',
      today: 'Bugun',
      now: 'Hozir',
      month: 'Oy',
      year: 'Yil',
      monthSelect: 'Oyni tanlang',
      yearSelect: 'Yilni tanlang',
      dayFormat: 'D',
      monthFormat: 'MMMM',
      yearFormat: 'YYYY',
      dateFormat: 'DD.MM.YYYY',
      monthBeforeYear: false
    }
  }
});

// Barcha DatePicker komponentlari uchun yagona standart props
export const getStandardDatePickerProps = () => ({
  ...getStandardCalendarProps(),
  renderExtraFooter: () => (
    <div 
      style={{ 
        textAlign: 'center', 
        color: '#1890ff', 
        cursor: 'pointer',
        padding: '8px 0',
        fontSize: '14px',
        fontWeight: '500'
      }}
      onClick={() => {
        // Bugungi kunni tanlash
        const todayBtn = document.querySelector('.ant-picker-today-btn');
        if (todayBtn) todayBtn.click();
      }}
    >
      Bugun: {moment().format('DD.MM.YYYY')}
    </div>
  )
});

// Export qilish uchun backward compatibility
export const getCurrentMonthDatePickerProps = getStandardDatePickerProps;
export const restrictToCurrentMonth = updateCalendarCellStyles;
export const restrictDateNavigation = updateCalendarCellStyles;

// RangePicker uchun standart props
export const getStandardRangePickerProps = () => ({
  ...getStandardCalendarProps(),
  ranges: {
    'Bugun': [moment(), moment()],
    'Kecha': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    'Oxirgi 7 kun': [moment().subtract(7, 'days'), moment()],
    'Oxirgi 30 kun': [moment().subtract(30, 'days'), moment()],
    'Bu oy': [moment().startOf('month'), moment()]
  },
  renderExtraFooter: () => (
    <div 
      style={{ 
        textAlign: 'center', 
        color: '#1890ff', 
        padding: '8px 0',
        fontSize: '14px'
      }}
    >
      Bugun: {moment().format('DD.MM.YYYY')}
    </div>
  )
});

// Export for backward compatibility
export const getCurrentMonthRangePickerProps = getStandardRangePickerProps;
export const disableOutsideCurrentMonth = disableFutureDates;
