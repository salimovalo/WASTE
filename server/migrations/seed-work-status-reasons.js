const { WorkStatusReason } = require('../models');

const defaultReasons = [
  // Texnik muammolar
  {
    name: 'Dvigatel ishlamayapti',
    description: 'Texnikaning dvigateli ishga tushmayapti yoki ishlamayapti',
    category: 'technical',
    severity: 'high'
  },
  {
    name: 'Gidravlik tizim nosozligi',
    description: 'Chiqindi yig\'ish uchun gidravlik tizim ishlamayapti',
    category: 'technical',
    severity: 'high'
  },
  {
    name: 'Fren tizimi nosozligi',
    description: 'Texnikaning fren tizimi ishlamayapti',
    category: 'technical',
    severity: 'critical'
  },
  {
    name: 'Shinalar shikastlangan',
    description: 'Texnikaning shinasi punchlangan yoki yirtilgan',
    category: 'technical',
    severity: 'medium'
  },
  {
    name: 'Elektr tizimi nosozligi',
    description: 'Elektr tizimi yoki akkumulyator muammosi',
    category: 'technical',
    severity: 'medium'
  },

  // Profilaktika/Ta\'mir
  {
    name: 'Rejalashtirilgan profilaktika',
    description: 'Texnikaga rejali profilaktika o\'tkazilmoqda',
    category: 'maintenance',
    severity: 'low'
  },
  {
    name: 'Katta ta\'mir',
    description: 'Texnikaga katta ta\'mir ishlari o\'tkazilmoqda',
    category: 'maintenance',
    severity: 'medium'
  },
  {
    name: 'Ehtiyot qismlar kutilmoqda',
    description: 'Ta\'mir uchun ehtiyot qismlar yetkazib berilishini kutish',
    category: 'maintenance',
    severity: 'medium'
  },

  // Ma\'muriy sabablar
  {
    name: 'Litsenziya yangilanmoqda',
    description: 'Texnikaning litsenziyasi yangilanish jarayonida',
    category: 'administrative',
    severity: 'medium'
  },
  {
    name: 'Sug\'urta muammosi',
    description: 'Texnika sug\'urtasi bilan bog\'liq muammolar',
    category: 'administrative',
    severity: 'medium'
  },
  {
    name: 'Hujjat rasmiylashtiruvi',
    description: 'Zarur hujjatlarni rasmiylashtirish jarayoni',
    category: 'administrative',
    severity: 'low'
  },

  // Ob-havo sharoiti
  {
    name: 'Yomg\'ir/qor',
    description: 'Kuchli yomg\'ir yoki qor tufayli ish mumkin emas',
    category: 'weather',
    severity: 'medium'
  },
  {
    name: 'Tuman/ko\'rinish yomon',
    description: 'Kuchli tuman tufayli ko\'rinish yomon',
    category: 'weather',
    severity: 'medium'
  },
  {
    name: 'Kuchli shamol',
    description: 'Kuchli shamol tufayli xavfsizlik yo\'q',
    category: 'weather',
    severity: 'medium'
  },

  // Yoqilg\'i muammosi
  {
    name: 'Yoqilg\'i tugagan',
    description: 'Texnikada yoqilg\'i tugagan',
    category: 'fuel',
    severity: 'medium'
  },
  {
    name: 'Yoqilg\'i stansiyasi yopiq',
    description: 'Yoqilg\'i olish uchun stansiya yopiq',
    category: 'fuel',
    severity: 'low'
  },
  {
    name: 'Yoqilg\'i sifati yomon',
    description: 'Yomon sifatli yoqilg\'i tufayli texnika ishlamayapti',
    category: 'fuel',
    severity: 'high'
  },

  // Haydovchi bilan bog\'liq
  {
    name: 'Haydovchi kasal',
    description: 'Haydovchi kasallik tufayli ishga chiqa olmayapti',
    category: 'driver',
    severity: 'medium'
  },
  {
    name: 'Haydovchi ta\'tilda',
    description: 'Haydovchi ta\'tilda yoki ruxsatda',
    category: 'driver',
    severity: 'low'
  },
  {
    name: 'Haydovchilik guvohnomasi muammosi',
    description: 'Haydovchilik guvohnomasi bilan bog\'liq muammolar',
    category: 'driver',
    severity: 'high'
  },

  // Boshqa sabablar
  {
    name: 'Avtohalokatga uchragan',
    description: 'Texnika avtohalokatga uchragan',
    category: 'other',
    severity: 'critical'
  },
  {
    name: 'O\'g\'irlanish/vandalizm',
    description: 'Texnika o\'g\'irlanish yoki vandalizm qurboni bo\'lgan',
    category: 'other',
    severity: 'critical'
  },
  {
    name: 'Boshqa texnik sabab',
    description: 'Yuqorida ko\'rsatilmagan boshqa texnik sabablar',
    category: 'other',
    severity: 'medium'
  }
];

const seedWorkStatusReasons = async () => {
  try {
    console.log('🌱 Kunlik ish holati sabablarini yaratish...');
    
    for (const reasonData of defaultReasons) {
      const existingReason = await WorkStatusReason.findOne({
        where: { name: reasonData.name }
      });
      
      if (!existingReason) {
        await WorkStatusReason.create(reasonData);
        console.log(`✅ Sabab yaratildi: ${reasonData.name}`);
      } else {
        console.log(`⏭️  Sabab allaqachon mavjud: ${reasonData.name}`);
      }
    }
    
    console.log('✅ Kunlik ish holati sabablari muvaffaqiyatli yaratildi');
    
  } catch (error) {
    console.error('❌ Sabablarni yaratishda xatolik:', error);
    throw error;
  }
};

module.exports = { seedWorkStatusReasons };
