const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  middle_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^[\+]?[0-9\-\(\)\s]+$/
    }
  },
  passport: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [5, 20]
    }
  },
  position: {
    type: DataTypes.ENUM('driver', 'loader'),
    allowNull: false,
    validate: {
      isIn: [['driver', 'loader']]
    }
  },
  hire_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  birth_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  emergency_contact: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^[\+]?[0-9\-\(\)\s]+$/
    }
  },
  emergency_contact_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  salary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  vehicle_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'vehicles',
      key: 'id'
    }
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  district_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'districts',
      key: 'id'
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'employees',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['company_id']
    },
    {
      fields: ['district_id']
    },
    {
      fields: ['position']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['passport']
    },
    {
      fields: ['vehicle_id']
    }
  ]
});

// Instance methodlar
Employee.prototype.getFullName = function() {
  const names = [this.first_name, this.middle_name, this.last_name].filter(Boolean);
  return names.join(' ');
};

Employee.prototype.getPositionName = function() {
  const positions = {
    driver: 'Haydovchi',
    loader: 'Yuk ortuvchi'
  };
  return positions[this.position] || this.position;
};

Employee.prototype.getWorkExperience = function() {
  if (!this.hire_date) return 0;
  const now = new Date();
  const hire = new Date(this.hire_date);
  const diffTime = Math.abs(now - hire);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 365); // Years
};

module.exports = Employee;
