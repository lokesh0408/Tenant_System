import { CollectionConfig } from 'payload'

export const BookingLogs: CollectionConfig = {
  slug: 'booking-logs',
  access: {
    create: () => true, // allow hooks to create logs
    read: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'organizer',
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'booking',
      type: 'relationship',
      relationTo: 'bookings',
      required: true,
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'action',
      type: 'select',
      options: [
        'create_request',
        'auto_waitlist',
        'auto_confirm',
        'promote_from_waitlist',
        'cancel_confirmed',
      ],
      required: true,
    },
    {
      name: 'note',
      type: 'text',
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
    },
  ],
  timestamps: true,
}
