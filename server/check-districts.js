const { District } = require('./models');

async function checkDistricts() {
  try {
    const districts = await District.findAll();
    console.log('Jami tumanlar soni:', districts.length);
    console.log('Faol tumanlar soni:', districts.filter(d => d.is_active).length);
    console.log('Faolsiz tumanlar soni:', districts.filter(d => !d.is_active).length);
    console.log('\nBarcha tumanlar:');
    
    districts.forEach((d, i) => {
      console.log(`${i+1}. ${d.name} (${d.code}) - ${d.is_active ? 'Faol' : 'Faolsiz'}`);
    });
    
    process.exit(0);
  } catch(error) {
    console.error('Xatolik:', error);
    process.exit(1);
  }
}

checkDistricts();
