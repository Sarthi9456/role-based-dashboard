'use strict';

module.exports = (sequelize, DataTypes) => {
  const ProjectEmployee = sequelize.define(
    'ProjectEmployee',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      projectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Projects', key: 'id' },
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
      },
    },
    {
      tableName: 'ProjectEmployees',
      timestamps: true,
      indexes: [{ unique: true, fields: ['projectId', 'userId'] }],
    }
  );

  return ProjectEmployee;
};
