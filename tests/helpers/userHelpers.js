const request = require('supertest');
const app = require('../../src/service');
const { faker } = require('@faker-js/faker')

exports.createDiner = async () => {
  const name = faker.person.fullName()

  const [firstName, lastName] = name.split(' ')
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