const { Employee, Company, District } = require('../models');

async function testTripSheetEmployees() {
  try {
    console.log('🧪 Testing TripSheet Employee integration...\n');
    
    // Check total employees
    const totalEmployees = await Employee.count();
    console.log(`📊 Total employees: ${totalEmployees}`);
    
    // Check drivers
    const drivers = await Employee.findAll({
      where: { position: 'driver', is_active: true },
      include: [
        { model: Company, as: 'company', attributes: ['name'] },
        { model: District, as: 'district', attributes: ['name'] }
      ],
      limit: 5
    });
    
    console.log(`🚗 Active drivers found: ${drivers.length}`);
    drivers.forEach(driver => {
      console.log(`  - ${driver.first_name} ${driver.last_name} (${driver.company?.name || 'No company'} - ${driver.district?.name || 'No district'})`);
    });
    
    // Check loaders
    const loaders = await Employee.findAll({
      where: { position: 'loader', is_active: true },
      include: [
        { model: Company, as: 'company', attributes: ['name'] },
        { model: District, as: 'district', attributes: ['name'] }
      ],
      limit: 5
    });
    
    console.log(`\n📦 Active loaders found: ${loaders.length}`);
    loaders.forEach(loader => {
      console.log(`  - ${loader.first_name} ${loader.last_name} (${loader.company?.name || 'No company'} - ${loader.district?.name || 'No district'})`);
    });
    
    // Check by company
    const companiesWithEmployees = await Company.findAll({
      include: [{
        model: Employee,
        as: 'employees',
        attributes: ['id', 'first_name', 'last_name', 'position'],
        where: { is_active: true },
        required: false
      }],
      limit: 3
    });
    
    console.log(`\n🏢 Companies with employees:`);
    companiesWithEmployees.forEach(company => {
      console.log(`  - ${company.name}: ${company.employees?.length || 0} employees`);
      if (company.employees && company.employees.length > 0) {
        company.employees.slice(0, 2).forEach(emp => {
          console.log(`    * ${emp.first_name} ${emp.last_name} (${emp.position})`);
        });
      }
    });
    
    console.log('\n✅ TripSheet Employee test completed!');
    
  } catch (error) {
    console.error('❌ Error testing TripSheet employees:', error);
  } finally {
    process.exit(0);
  }
}

testTripSheetEmployees();
