const { DB } = require('../src/database/database')

afterEach(async () => {
  await DB.clearDatabase()
})