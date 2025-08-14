import { CollectionConfig } from 'payload'
import { tenantAccess, canCreate } from '../access/tenantAccess.js'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    // Only organizers and admins can create events
    create: canCreate,
    // Any user can see events within their own tenant
    read: tenantAccess,
    // Only organizers and admins can update events
    update: canCreate,
    // Only organizers and admins can delete events
    delete: canCreate,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'date',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      required: true,
    },
    {
      name: 'capacity',
      type: 'number',
      required: true,
      min: 1,
    },
    {
      name: 'organizer',
      type: 'relationship',
      relationTo: 'users',
      // We'll add a filter here later to only show 'organizer' or 'admin' users.
      required: true,
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
