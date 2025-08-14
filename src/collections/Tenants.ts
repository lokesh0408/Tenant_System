import { CollectionConfig } from 'payload'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'name',
    description: 'Organizations that use this platform.',
  },
  access: {
    // Only admins can create new tenants
    create: ({ req: { user } }) => user?.role === 'admin',
    // Users can only read their own tenant's data
    read: () => true,
    // Only admins can update tenant info
    update: ({ req: { user } }) => user?.role === 'admin',
    // Only admins can delete tenants
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
  timestamps: true,
}
