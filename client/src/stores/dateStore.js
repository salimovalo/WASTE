import { create } from 'zustand';
import moment from 'moment';

// Global sana store
const useDateStore = create((set, get) => ({
  // State
  selectedDate: moment(), // Standart bugungi kun
  
  // Actions
  setSelectedDate: (date) => {
    // Moment objectga aylantirish
    const momentDate = moment.isMoment(date) ? date : moment(date);
    
    // Kelajak kunlarni taqiqlash
    const today = moment();
    const validDate = momentDate && momentDate.isValid() && momentDate.isAfter(today, 'day') 
      ? today 
      : momentDate;
    
    set({ selectedDate: validDate });
    
    // Sana o'zgarganda barcha sahifalarni yangilash uchun event
    window.dispatchEvent(new CustomEvent('dateChanged', { 
      detail: { date: validDate } 
    }));
  },
  
  // Bugungi kunga qaytish
  resetToToday: () => {
    const today = moment();
    set({ selectedDate: today });
    window.dispatchEvent(new CustomEvent('dateChanged', { 
      detail: { date: today } 
    }));
  },
  
  // Sana formatini olish
  getFormattedDate: () => {
    const date = get().selectedDate;
    return date && moment.isMoment(date) ? date.format('DD.MM.YYYY') : moment().format('DD.MM.YYYY');
  },
  
  // API uchun format
  getApiDate: () => {
    const date = get().selectedDate;
    return date && moment.isMoment(date) ? date.format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
  }
}));

export default useDateStore;
