'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('pinned_chats', {
      id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
      user_id: {type: Sequelize.INTEGER, allowNull: false},
      contact_id: {type: Sequelize.INTEGER, allowNull: true},
      group_id: {type: Sequelize.INTEGER, allowNull: true},
      created_at: {type: Sequelize.DATE, allowNull: false},
    });

    await queryInterface.createTable('blocked_users', {
      id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true},
      user_id: {type: Sequelize.INTEGER, allowNull: false},
      blocked_user_id: {type: Sequelize.INTEGER, allowNull: false},
      created_at: {type: Sequelize.DATE, allowNull: false},
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('blocked_users');
    await queryInterface.dropTable('pinned_chats');
  }
};
