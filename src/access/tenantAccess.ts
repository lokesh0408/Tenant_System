import { Access, AccessArgs, Where } from 'payload'
import { User } from '../payload-types'

// Helpers
const isAdmin = (user: User | null) => user?.role === 'admin'
const isAdminOrOrganizer = (user: User | null) =>
  user?.role === 'admin' || user?.role === 'organizer'

// Query constraint for tenant-based filtering
const aQueryConstraint = (user: User | null): Where | boolean => {
  if (!user) return false
  if (user.role === 'admin') return true

  return {
    tenant: {
      equals: typeof user.tenant === 'object' ? user.tenant.id : user.tenant,
    },
  }
}

// Tenant-level access
export const tenantAccess: Access = ({ req: { user } }: AccessArgs<User>) => {
  if (!user) return false
  if (isAdmin(user)) return true
  return aQueryConstraint(user)
}

// Read own data (attendees only see themselves)
export const canReadOwn: Access = ({ req: { user } }: AccessArgs<User>) => {
  if (!user) return false

  if (isAdminOrOrganizer(user)) {
    return aQueryConstraint(user)
  }

  return {
    user: {
      equals: user.id,
    },
  }
}

// Update own data
export const canUpdateOwn: Access = ({ req: { user } }: AccessArgs<User>) => {
  if (!user) return false

  if (isAdminOrOrganizer(user)) {
    return aQueryConstraint(user)
  }

  return {
    user: {
      equals: user.id,
    },
  }
}

// Create permission (admin or organizer only)
export const canCreate: Access = ({ req: { user } }: AccessArgs<User>) => {
  return isAdminOrOrganizer(user) || false
}

// Completely read-only
export const readOnly: Access = () => false
