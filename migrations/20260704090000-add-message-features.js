'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('messages', 'reply_to_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('messages', 'reactions', {
      type: Sequelize.JSON,
      allowNull: true,
    });
    await queryInterface.addColumn('messages', 'delivered_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('messages', 'delivered_at');
    await queryInterface.removeColumn('messages', 'reactions');
    await queryInterface.removeColumn('messages', 'reply_to_id');
  }
};
