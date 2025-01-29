const { faker } = require('@faker-js/faker/.')
const { DB } = require('../../src/database/database')

exports.createMenuItem = async () => {
  const menuItem = {
    title: faker.food.dish(),
    description: faker.food.description(),
    image: faker.system.commonFileName('png'),
    price: Number(faker.commerce.price({ max: 5, min: 0 }))
  }

  return await DB.addMenuItem(menuItem)
}

exports.createOrder = async (user, store) => {
  const menuItems = await Promise.all(
    Array.from({ length: 5}).map(async () => {
      const item = await this.createMenuItem()

      return {
        menuId: item.id,
        description: item.description,
        price: item.price
      }
    }
  ))

  const order = {
    franchiseId: store.franchiseId,
    storeId: store.id,
    items: menuItems
  }

  return await DB.addDinerOrder(user, order)
}