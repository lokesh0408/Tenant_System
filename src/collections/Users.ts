import { CollectionConfig } from 'payload'
import { tenantAccess, canUpdateOwn } from '../access/tenantAccess.js'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'name',
  },
  access: {
    // Anyone can create a user (sign up)
    create: () => true,
    // Organizers/Admins can see all users in their tenant. Attendees see only themselves.
    read: tenantAccess,
    // Organizers/Admins can update users in their tenant. Attendees can update themselves.
    update: canUpdateOwn,
    // Only admins can delete users
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'role',
      type: 'select',
      options: ['admin', 'organizer', 'attendee'],
      defaultValue: 'attendee',
      required: true,
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      // When a user is created, we want to associate them with a tenant.
      // This can be done in a hook or by making it editable in the admin UI.
    },
  ],
  timestamps: true,
}
