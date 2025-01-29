const request = require('supertest');
const app = require('../../src/service');
const { faker } = require('@faker-js/faker')
const { DB, Role} = require('../../src/database/database')

exports.createDiner = async () => {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  const name = firstName + ' ' + lastName

  const email = faker.internet.email({ firstName, lastName, provider: 'test.com' })
  const password = faker.internet.password()

  const diner = {
    name,
    email,
    password
  }

  const result = await request(app).post('/api/auth').send(diner)

  const { user, token } = result.body

  return {
    user,
    token,
    password
  }
}

exports.createAdminUser = async () => {
  let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  user.name = firstName + ' ' + lastName

  user.email = faker.internet.email({ firstName, lastName, provider: 'admin.com' })

  user = await DB.addUser(user);
  user.password = 'toomanysecrets'

  const loginRequestBody = {
    email: user.email,
    password: user.password
  }
  const loginRes = await request(app).put('/api/auth').send(loginRequestBody)
  const { token } = loginRes.body

  return { user, token }
}