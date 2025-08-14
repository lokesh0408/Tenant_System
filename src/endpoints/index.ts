import { Payload } from 'payload'

// Helper for the dashboard endpoint
async function getBookingCounts(payload: Payload, eventId: string) {
  const { totalDocs: confirmedCount } = await payload.find({
    collection: 'bookings',
    where: { event: { equals: eventId }, status: { equals: 'confirmed' } },
    limit: 0,
  })
  const { totalDocs: waitlistedCount } = await payload.find({
    collection: 'bookings',
    where: { event: { equals: eventId }, status: { equals: 'waitlisted' } },
    limit: 0,
  })
  const { totalDocs: canceledCount } = await payload.find({
    collection: 'bookings',
    where: { event: { equals: eventId }, status: { equals: 'canceled' } },
    limit: 0,
  })
  return { confirmedCount, waitlistedCount, canceledCount }
}

// Define Endpoint type
export interface Endpoint {
  path: string
  method: 'get' | 'post' | 'put' | 'delete' | 'patch'
  handler: (
    req: { payload: Payload; body: any; user?: any; params?: any },
    res: { status: (code: number) => any; json: (data: any) => any },
  ) => Promise<void>
}

// Helper function to ensure user is logged in
const ensureAuthenticated = (req: { user?: any }) => {
  if (!req.user) {
    throw new Error('You must be logged in to perform this action.')
  }
}

export const customEndpoints: Endpoint[] = [
  {
    path: '/book-event',
    method: 'post',
    handler: async (req, res) => {
      try {
        // ensureAuthenticated(req)
        const { eventId } = req.body
        if (!eventId) {
          return res.status(400).json({ error: 'eventId is required.' })
        }

        const booking = await req.payload.create({
          collection: 'bookings',
          data: {
            event: eventId,
            user: req.user.id,
            tenant: req.user.tenant,
            status: 'confirmed',
          },
        })

        return res.status(201).json({ message: 'Booking request received.', bookingId: booking.id })
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err))
        console.log('error in booking creation')
        return res.status(500).json({ error: error.message })
      }
    },
  },
  {
    path: '/cancel-booking',
    method: 'post',
    handler: async (req, res) => {
      try {
        ensureAuthenticated(req)
        const { bookingId } = req.body
        if (!bookingId) {
          return res.status(400).json({ error: 'bookingId is required.' })
        }

        const booking = await req.payload.findByID({ collection: 'bookings', id: bookingId })

        if (typeof booking.user === 'object' && booking.user.id !== req.user.id) {
          return res.status(403).json({ error: 'You are not authorized to cancel this booking.' })
        }

        await req.payload.update({
          collection: 'bookings',
          id: bookingId,
          data: { status: 'canceled' },
        })

        return res.status(200).json({ message: 'Booking canceled successfully.' })
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err))
        return res.status(500).json({ error: error.message })
      }
    },
  },
  {
    path: '/my-bookings',
    method: 'get',
    handler: async (req, res) => {
      try {
        // ensureAuthenticated(req)
        return await req.payload.find({
          collection: 'bookings',
          where: { user: { equals: '1' } },
          depth: 2,
        })
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err))
        return res.status(500).json({ error: error.message })
      }
    },
  },
  {
    path: '/my-notifications',
    method: 'get',
    handler: async (req, res) => {
      try {
        ensureAuthenticated(req)
        return await req.payload.find({
          collection: 'notifications',
          where: { user: { equals: req.user.id }, read: { equals: false } },
          sort: '-createdAt',
        })
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err))
        return res.status(500).json({ error: error.message })
      }
    },
  },
  {
    path: '/notifications/:id/read',
    method: 'post',
    handler: async (req, res) => {
      try {
        ensureAuthenticated(req)
        const notificationId = req.params?.id
        if (!notificationId) return res.status(400).json({ error: 'Notification ID is required.' })

        const notification = await req.payload.findByID({
          collection: 'notifications',
          id: notificationId,
        })
        if (typeof notification.user === 'object' && notification.user.id !== req.user.id) {
          return res.status(403).json({ error: 'Unauthorized.' })
        }

        await req.payload.update({
          collection: 'notifications',
          id: notificationId,
          data: { read: true },
        })
        return res.status(200).json({ message: 'Notification marked as read.' })
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err))
        return res.status(500).json({ error: error.message })
      }
    },
  },
  {
    path: '/dashboard',
    method: 'get',
    handler: async (req, res) => {
      try {
        ensureAuthenticated(req)
        if (req.user.role !== 'organizer' && req.user.role !== 'admin') {
          return res
            .status(403)
            .json({ error: 'Only organizers and admins can access the dashboard.' })
        }

        const tenantId = typeof req.user.tenant === 'object' ? req.user.tenant.id : req.user.tenant
        const payload = req.payload

        // 1. Upcoming Events with counts
        const { docs: events } = await payload.find({
          collection: 'events',
          where: {
            tenant: { equals: tenantId },
            date: { greater_than_equal: new Date().toISOString() },
          },
          depth: 0,
        })

        const eventsWithCounts = await Promise.all(
          events.map(async (event) => {
            const counts = await getBookingCounts(payload, event.id.toString())
            return {
              ...event,
              ...counts,
              percentageFilled:
                event.capacity > 0 ? (counts.confirmedCount / event.capacity) * 100 : 0,
            }
          }),
        )

        // 2. Summary Analytics
        const allBookings = await payload.find({
          collection: 'bookings',
          where: { tenant: { equals: tenantId } },
          limit: 0,
          depth: 0,
        })
        const summary = {
          totalEvents: events.length,
          totalConfirmedBookings: allBookings.docs.filter((b) => b.status === 'confirmed').length,
          totalWaitlistedBookings: allBookings.docs.filter((b) => b.status === 'waitlisted').length,
          totalCanceledBookings: allBookings.docs.filter((b) => b.status === 'canceled').length,
        }

        // 3. Recent Activity
        const { docs: recentActivity } = await payload.find({
          collection: 'booking-logs',
          where: { tenant: { equals: tenantId } },
          sort: '-createdAt',
          limit: 5,
          depth: 2, // Populate related docs
        })

        return res.status(200).json({ upcomingEvents: eventsWithCounts, summary, recentActivity })
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err))
        return res.status(500).json({ error: error.message })
      }
    },
  },
]
