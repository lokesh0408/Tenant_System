import payload from 'payload'
import type { InitOptions } from 'payload'
import path from 'path'
import dotenv from 'dotenv'
import config from './payload.config.js'

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
})

const seed = async (): Promise<void> => {
  const initOptions: InitOptions = {
    config, // Required in InitOptions
  }
  console.log('Connecting to database with config:', (await config).db)
  try {
    await payload.init(initOptions)
  } catch (err) {
    console.error('Payload init error:', err)
    process.exit(1)
  }

  console.log('Seeding database...')

  const [tenant1, tenant2] = await Promise.all([
    payload.create({ collection: 'tenants', data: { name: 'Tenant 3' } }),
    payload.create({ collection: 'tenants', data: { name: 'Tenant 4' } }),
  ])

  const org1 = await payload.create({
    collection: 'users',
    data: {
      name: 'Alice (Org)',
      email: 'alice@techcon.com',
      password: 'password',
      role: 'organizer',
      tenant: tenant1.id,
    },
  })
  await payload.create({
    collection: 'users',
    data: {
      name: 'Bob',
      email: 'bob@techcon.com',
      password: 'password',
      role: 'attendee',
      tenant: tenant1.id,
    },
  })
  await payload.create({
    collection: 'events',
    data: {
      title: 'AI in 2025',
      date: '2025-10-20T10:00:00Z',
      capacity: 1,
      organizer: org1.id,
      tenant: tenant1.id,
    },
  })

  const org2 = await payload.create({
    collection: 'users',
    data: {
      name: 'Charlie (Org)',
      email: 'charlie@creativeminds.com',
      password: 'password',
      role: 'organizer',
      tenant: tenant2.id,
    },
  })
  await payload.create({
    collection: 'users',
    data: {
      name: 'Diana',
      email: 'diana@creativeminds.com',
      password: 'password',
      role: 'attendee',
      tenant: tenant2.id,
    },
  })
  await payload.create({
    collection: 'events',
    data: {
      title: 'The Future of Design',
      date: '2025-11-15T14:00:00Z',
      capacity: 50,
      organizer: org2.id,
      tenant: tenant2.id,
    },
  })

  console.log('Database seeded successfully!')
  process.exit(0)
}

seed()
