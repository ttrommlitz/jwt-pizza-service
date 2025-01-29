const request = require('supertest');
const app = require('../service');
const { createDiner, createAdminUser } = require('../../tests/helpers/userHelpers')
const { expectValidJwt } = require('../../tests/helpers/miscHelpers');
const { createMenuItem, createOrder } = require('../../tests/helpers/orderHelpers');
const { createStore } = require('../../tests/helpers/franchiseHelpers');
const { faker } = require('@faker-js/faker/.');

it('allows admin to add a menu item', async () => {
  const { user, token } = await createAdminUser()
  expectValidJwt(token)

  const addMenuItemRequestBody = {
    title: 'Pepperoni Pizza',
    description: 'Delicious pepperoni',
    image: 'pepperoni.png',
    price: 0.01
  }

  const addMenuItemRes = await request(app)
    .put('/api/order/menu')
    .send(addMenuItemRequestBody)
    .set('authorization', `Bearer ${token}`)

  expect(addMenuItemRes.status).toBe(200)
  expect(addMenuItemRes.body).toBeInstanceOf(Array)
  expect(addMenuItemRes.body.length).toBe(1)

  const { id, ...menuItem } = addMenuItemRes.body[0]
  expect(menuItem).toMatchObject(addMenuItemRequestBody)
})

it('does not allow a non-admin to add a menu item', async () => {
  const { user, token } = await createDiner()
  expectValidJwt(token)

  const addMenuItemRequestBody = {
    title: 'Pepperoni Pizza',
    description: 'Delicious pepperoni',
    image: 'pepperoni.png',
    price: 0.01
  }

  const addMenuItemRes = await request(app)
    .put('/api/order/menu')
    .send(addMenuItemRequestBody)
    .set('authorization', `Bearer ${token}`)

  expect(addMenuItemRes.status).toBe(403)
  expect(addMenuItemRes.body.message).toBe('unable to add menu item')
})

it('returns the entire menu', async () => {
  const item1 = await createMenuItem()
  const item2 = await createMenuItem()
  const item3 = await createMenuItem()

  const getMenuRes = await request(app)
    .get('/api/order/menu')

  expect(getMenuRes.status).toBe(200)
  expect(getMenuRes.body).toBeInstanceOf(Array)
  expect(getMenuRes.body.length).toBe(3)
})

it('allows a user to create an order', async () => {
  // mock the API call to PizzaFactory
  global.fetch = jest.fn((url) => {
    return Promise.resolve({
      json: () => {
        return Promise.resolve({ reportUrl: 'report@jwtpizza.com', jwt: faker.internet.jwt() })
      },
      ok: true
    })
  })

  const { user, token } = await createDiner()
  expectValidJwt(token)

  const item1 = await createMenuItem()
  const item2 = await createMenuItem()

  const store = await createStore()

  const createOrderRequestBody = {
    franchiseId: store.franchiseId,
    storeId: store.id,
    items: [item1, item2].map(({ id, description, price}) => ({ menuId: id, description, price }))
  }

  const createOrderRes = await request(app)
    .post('/api/order')
    .send(createOrderRequestBody)
    .set('authorization', `Bearer ${token}`)

  expect(createOrderRes.status).toBe(200)
  expect(createOrderRes.body.order).toMatchObject(createOrderRequestBody)
  expect(createOrderRes.body.jwt).toBeDefined()
})

it('fails to place an order if the pizza factory is down', async () => {
  // mock the API call to PizzaFactory
  global.fetch = jest.fn((url) => {
    return Promise.resolve({
      json: () => {
        return Promise.resolve({ reportUrl: 'report@jwtpizza.com', jwt: null })
      },
      ok: false
    })
  })

  const { user, token } = await createDiner()
  expectValidJwt(token)

  const item1 = await createMenuItem()
  const item2 = await createMenuItem()

  const store = await createStore()

  const createOrderRequestBody = {
    franchiseId: store.franchiseId,
    storeId: store.id,
    items: [item1, item2].map(({ id, description, price}) => ({ menuId: id, description, price }))
  }

  const createOrderRes = await request(app)
    .post('/api/order')
    .send(createOrderRequestBody)
    .set('authorization', `Bearer ${token}`)

  expect(createOrderRes.status).toBe(500)
  expect(createOrderRes.body.message).toBe('Failed to fulfill order at factory')
  expect(createOrderRes.body.reportPizzaCreationErrorToPizzaFactoryUrl).toBe('report@jwtpizza.com')
})

it('allows a user to fetch their orders', async () => {
  const { user, token } = await createDiner()
  expectValidJwt(token)

  const store = await createStore()

  await createOrder(user, store)
  await createOrder(user, store)
  await createOrder(user, store)

  const getOrdersRes = await request(app)
    .get('/api/order')
    .set('authorization', `Bearer ${token}`)

  expect(getOrdersRes.status).toBe(200)
  expect(getOrdersRes.body.dinerId).toBe(user.id)
  expect(getOrdersRes.body.orders).toBeInstanceOf(Array)
  expect(getOrdersRes.body.orders.length).toBe(3)
})