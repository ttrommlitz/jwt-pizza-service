const { faker } = require('@faker-js/faker/.')
const { DB, Role} = require('../../src/database/database')
const { createAdminUser } = require('./userHelpers')

exports.createFranchise = async (adminEmail) => {
  // if no admin for the franchise is provided, create one
  if (!adminEmail) {
    const { user, token } = await createAdminUser()
    adminEmail = user.email
  }
  const franchise = {
    name: faker.company.name(),
    admins: [{ email: adminEmail }]
  }
  return await DB.createFranchise(franchise)
}

exports.createStore = async (franchiseId, franchiseAdminEmail) => {
  //if no franchise for the store is provided, create one
  if (!franchiseId) {
    const franchise = await this.createFranchise(franchiseAdminEmail)
    franchiseId = franchise.id
  }

  const store = {
    name: faker.company.name()
  }
  return await DB.createStore(franchiseId, store)
}