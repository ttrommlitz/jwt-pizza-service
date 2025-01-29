const request = require('supertest');
const app = require('../service');
const { createDiner, createAdminUser } = require('../../tests/helpers/userHelpers')
const { expectValidJwt } = require('../../tests/helpers/miscHelpers');
const { createFranchise, createStore } = require('../../tests/helpers/franchiseHelpers');

it('allows admin to create a franchise successfully', async () => {
  const { user, token } = await createAdminUser()
  expectValidJwt(token)

  const createFranchiseRequestBody = {
    name: 'Test Pizza Franchise',
    admins: [{ email: user.email }]
  }

  const createFranchiseRes = await request(app)
    .post('/api/franchise')
    .send(createFranchiseRequestBody)
    .set('authorization', `Bearer ${token}`)

  expect(createFranchiseRes.status).toBe(200)

  expect(createFranchiseRes.body.name).toBe('Test Pizza Franchise')
  expect(createFranchiseRes.body.admins).toBeInstanceOf(Array)
  expect(createFranchiseRes.body.admins.length).toBe(1)
  expect(createFranchiseRes.body.admins[0]).toMatchObject({
    email: user.email,
    id: user.id,
    name: user.name
  })
})

it('does not allow a non-admin to create a franchise', async () => {
  // user is a diner instead of an admin
  const { user, token } = await createDiner()
  expectValidJwt(token)

  const createFranchiseRequestBody = {
    name: 'Test Pizza Franchise',
    admins: [{ email: user.email }]
  }

  const createFranchiseRes = await request(app)
    .post('/api/franchise')
    .send(createFranchiseRequestBody)
    .set('authorization', `Bearer ${token}`)

  expect(createFranchiseRes.status).toBe(403)
  expect(createFranchiseRes.body.message).toBe('unable to create a franchise')
})

it('returns a user\'s franchises', async () => {
  const { user, token } = await createAdminUser()
  expectValidJwt(token)

  const createdFranchise = await createFranchise(user.email)

  const getUserFranchisesRes = await request(app)
    .get(`/api/franchise/${user.id}`)
    .set('authorization', `Bearer ${token}`)

  expect(getUserFranchisesRes.status).toBe(200)

  expect(getUserFranchisesRes.body).toBeInstanceOf(Array)
  expect(getUserFranchisesRes.body.length).toBe(1)

  const franchise = getUserFranchisesRes.body[0]

  expect(franchise.id).toBe(createdFranchise.id)
  expect(franchise.name).toBe(createdFranchise.name)
  expect(franchise.admins).toBeInstanceOf(Array)
  expect(franchise.admins.length).toBe(1)

  expect(franchise.admins[0]).toMatchObject({
    email: user.email,
    id: user.id,
    name: user.name
  })
})

it('lists all franchises successfully', async () => {
  const franchise1 = await createFranchise()
  const franchise2 = await createFranchise()
  const franchise3 = await createFranchise()

  const { user, token } = await createDiner()
  expectValidJwt(token)

  const listFranchisesRes = await request(app)
    .get('/api/franchise')
    .set('authorization', `Bearer ${token}`)
   
  expect(listFranchisesRes.status).toBe(200)
  expect(listFranchisesRes.body).toBeInstanceOf(Array);
  expect(listFranchisesRes.body.length).toBe(3);
})

it('allows admin to delete a franchise successfully', async () => {
  const { user, token } = await createAdminUser()
  expectValidJwt(token)

  const createdFranchise = await createFranchise(user.email)

  const deleteFranchiseRes = await request(app)
    .delete(`/api/franchise/${createdFranchise.id}`)
    .set('authorization', `Bearer ${token}`)

  expect(deleteFranchiseRes.status).toBe(200)
  expect(deleteFranchiseRes.body.message).toBe('franchise deleted')

  const getUserFranchisesRes = await request(app)
    .get(`/api/franchise/${user.id}`)
    .set('authorization', `Bearer ${token}`)

  expect(getUserFranchisesRes.status).toBe(200)
  expect(getUserFranchisesRes.body).toBeInstanceOf(Array)
  expect(getUserFranchisesRes.body.length).toBe(0)
})

it('does not allow a non-admin to delete a franchise', async () => {
  const { user, token } = await createDiner()
  expectValidJwt(token)

  const createdFranchise = await createFranchise()

  const deleteFranchiseRes = await request(app)
    .delete(`/api/franchise/${createdFranchise.id}`)
    .set('authorization', `Bearer ${token}`)

  expect(deleteFranchiseRes.status).toBe(403)
  expect(deleteFranchiseRes.body.message).toBe('unable to delete a franchise')
})

it('allows admin to create a store successfully', async () => {
  const { user, token } = await createAdminUser()
  expectValidJwt(token)

  const createdFranchise = await createFranchise(user.email)

  const createStoreRequestBody = {
    name: 'Test Pizza Store'
  }

  const createStoreRes = await request(app)
    .post(`/api/franchise/${createdFranchise.id}/store`)
    .send(createStoreRequestBody)
    .set('authorization', `Bearer ${token}`)

  expect(createStoreRes.status).toBe(200)
  expect(createStoreRes.body.name).toBe('Test Pizza Store')
  expect(createStoreRes.body.franchiseId).toBe(createdFranchise.id)
})

it('does not allow a non-admin to create a store', async () => {
  const { user, token } = await createDiner()
  expectValidJwt(token)

  const createdFranchise = await createFranchise()

  const createStoreRequestBody = {
    name: 'Test Pizza Store'
  }

  const createStoreRes = await request(app)
    .post(`/api/franchise/${createdFranchise.id}/store`)
    .send(createStoreRequestBody)
    .set('authorization', `Bearer ${token}`)

  expect(createStoreRes.status).toBe(403)
  expect(createStoreRes.body.message).toBe('unable to create a store')
})

it('allows admin to delete a store successfully', async () => {
  const { user, token } = await createAdminUser()
  expectValidJwt(token)

  const createdFranchise = await createFranchise(user.email)

  const createdStore = await createStore(createdFranchise.id)

  const deleteStoreRes = await request(app)
    .delete(`/api/franchise/${createdFranchise.id}/store/${createdStore.id}`)
    .set('authorization', `Bearer ${token}`)

  expect(deleteStoreRes.status).toBe(200)
  expect(deleteStoreRes.body.message).toBe('store deleted')
})
it('does not allow a non-admin to delete a store', async () => {
  const { user, token } = await createDiner()
  expectValidJwt(token)

  const createdStore = await createStore()

  const deleteStoreRes = await request(app)
    .delete(`/api/franchise/${createdStore.franchiseId}/store/${createdStore.id}`)
    .set('authorization', `Bearer ${token}`)

  expect(deleteStoreRes.status).toBe(403)
  expect(deleteStoreRes.body.message).toBe('unable to delete a store')
})
