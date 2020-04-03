module.exports = {
  up: (queryInterface, Sequelize) => {
      return queryInterface.addColumn(
          'users',
          'avatar_id',
          {
              type: Sequelize.INTEGER,
              references: { model: 'files', keu: 'id' },
              onUpdate: 'CASCADE',
              onDelete: 'SET NULL',
              allowNull: true
          }
      )
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('usera', 'avatar_id');
  }
};
