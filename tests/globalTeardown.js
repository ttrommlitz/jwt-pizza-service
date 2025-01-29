const { DB } = require('../src/database/database')

module.exports = async (globalConfig, projectConfig) => {
  await DB.dropDatabase('test')
}