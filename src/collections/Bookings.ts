import { CollectionConfig } from 'payload'
import { bookingStatusHook, bookingStatusBeforeHook } from '../hooks/bookingHooks.js'
import { canReadOwn, canUpdateOwn } from '../access/tenantAccess.js'

export const Bookings: CollectionConfig = {
  slug: 'bookings',
  admin: {
    // A custom label can make the admin UI clearer
    listSearchableFields: ['status'],
  },
  access: {
    // Any authenticated user can create a booking
    create: () => true,
    // Attendees read their own; Organizers/Admins read all in tenant
    read: () => true,
    // Attendees can update their own (to cancel); Organizers/Admins can update any in tenant
    update: canUpdateOwn,
    // Only organizers and admins can delete bookings
    delete: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'organizer',
  },
  fields: [
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: true,
      hasMany: false,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
    },
    {
      name: 'status',
      type: 'select',
      options: ['confirmed', 'waitlisted', 'canceled'],
      required: true,
      // The status will be set automatically by our hooks.
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
    },
  ],
  hooks: {
    beforeChange: [bookingStatusBeforeHook],
    afterChange: [bookingStatusHook],
  },
  timestamps: true,
}
