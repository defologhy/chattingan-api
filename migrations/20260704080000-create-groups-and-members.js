'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('groups', {
      id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
      name: {type: Sequelize.STRING(100), allowNull: false},
      description: {type: Sequelize.TEXT, allowNull: true},
      avatar: {type: Sequelize.STRING, allowNull: true},
      created_by: {type: Sequelize.INTEGER, allowNull: false},
      created_at: {type: Sequelize.DATE, allowNull: false},
      updated_at: {type: Sequelize.DATE, allowNull: false},
    });

    await queryInterface.createTable('group_members', {
      id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
      group_id: {type: Sequelize.INTEGER, allowNull: false},
      user_id: {type: Sequelize.INTEGER, allowNull: false},
      role: {type: Sequelize.ENUM('admin', 'member'), defaultValue: 'member', allowNull: false},
      joined_at: {type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')},
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('group_members');
    await queryInterface.dropTable('groups');
  }
};
