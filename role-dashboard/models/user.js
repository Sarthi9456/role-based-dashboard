'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      password: {
        // stores the bcrypt hash, never the plain text password
        type: DataTypes.STRING,
        allowNull: false,
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Roles', key: 'id' },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'Users',
      timestamps: true,
      paranoid: true, // soft delete (adds deletedAt)
    }
  );

  User.associate = (models) => {
    User.belongsTo(models.Role, { foreignKey: 'roleId', as: 'role' });

    // Projects this user created (Admin/Manager)
    User.hasMany(models.Project, { foreignKey: 'createdBy', as: 'createdProjects' });

    // Tasks directly assigned to this user (Employee)
    User.hasMany(models.Task, { foreignKey: 'assignedTo', as: 'assignedTasks' });

    // Many-to-many: employees assigned to a project
    User.belongsToMany(models.Project, {
      through: models.ProjectEmployee,
      foreignKey: 'userId',
      otherKey: 'projectId',
      as: 'assignedProjects',
    });
  };

  // Never leak the password hash when a User instance is serialized (e.g. res.json / views)
  User.prototype.toSafeJSON = function () {
    const { id, name, email, roleId, isActive, createdAt, updatedAt } = this;
    return { id, name, email, roleId, isActive, createdAt, updatedAt, role: this.role };
  };

  return User;
};
