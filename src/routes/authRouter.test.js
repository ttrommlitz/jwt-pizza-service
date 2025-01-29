const request = require('supertest');
const app = require('../service');
const { createDiner } = require('../../tests/helpers/userHelpers')

it('registers a user successfully', async () => {
  const registerTestUser = { name: 'test diner', email: 'test@jwt.com', password: 'test' }
  const result = await request(app).post('/api/auth').send(registerTestUser)
  const { token: authToken } = result.body

  expect(result.status).toBe(200)
  expectValidJwt(authToken)

  const expectedUser = { ...registerTestUser, roles: [{ role: 'diner' }] };
  delete expectedUser.password;
  expect(result.body.user).toMatchObject(expectedUser)
})

it('fails to register a user without a password', async () => {
  const badTestUser = { name: 'test diner', email: 'test@jwt.com' } // missing password
  const result = await request(app).post('/api/auth').send(badTestUser)

  expect(result.status).toBe(400)
  expect(result.body.token).toBeUndefined()

  expect(result.body.message).toBeDefined()
})

it('logs in successfully', async () => {
  const { user, token, password } = await createDiner()
  expectValidJwt(token)

  const loginRequestBody = {
    email: user.email,
    password
  }
  const loginRes = await request(app).put('/api/auth').send(loginRequestBody);

  expect(loginRes.status).toBe(200);
  expectValidJwt(loginRes.body.token);

  const expectedUser = { ...user, roles: [{ role: 'diner' }] };
  delete expectedUser.password;
  expect(loginRes.body.user).toMatchObject(expectedUser);
});

it('allows a user to update their information', async () => {
  const { user, token } = await createDiner()
  expectValidJwt(token)

  // attempt to change password
  const updateUserRequestBody = {
    email: user.email,
    password: 'newpassword'
  }
  const updateRes = await request(app)
    .put(`/api/auth/${user.id}`)
    .send(updateUserRequestBody)
    .set('authorization', `Bearer ${token}`)

  expect(updateRes.status).toBe(200)
  expect(updateRes.body).toMatchObject(user)
})

it('logs out successfully', async () => {
  const { user, token } = await createDiner()
  expectValidJwt(token)

  const logoutRes = await request(app)
    .delete('/api/auth')
    .set('authorization', `Bearer ${token}`)

  expect(logoutRes.status).toBe(200)
  expect(logoutRes.body.message).toBe('logout successful')
})

function expectValidJwt(potentialJwt) {
  expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}