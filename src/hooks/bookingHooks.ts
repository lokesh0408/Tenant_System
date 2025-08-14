import { CollectionBeforeChangeHook, CollectionAfterChangeHook, Payload } from 'payload'
import { Booking, Event, User, Tenant } from '../payload-types'

type NotificationType =
  | 'waitlisted'
  | 'booking_confirmed'
  | 'waitlist_promoted'
  | 'booking_canceled'

type BookingLogAction =
  | 'auto_confirm'
  | 'auto_waitlist'
  | 'cancel_confirmed'
  | 'promote_from_waitlist'

// --- Helper to create notification and booking log ---
const createNotificationAndLog = async (
  payload: Payload,
  {
    booking,
    type,
    user,
    event,
    tenant,
    note,
  }: {
    booking: Booking
    type: NotificationType
    user: number | User
    event: Event
    tenant: number | Tenant
    note: string
  },
) => {
  const bookingId = booking.id
  const userId = typeof user === 'object' ? user.id : user
  const tenantId = typeof tenant === 'object' ? tenant.id : tenant
  const eventId = event.id

  let title = ''
  let message = ''
  let action: BookingLogAction

  switch (type) {
    case 'booking_confirmed':
      title = 'Booking Confirmed!'
      message = `Your booking for "${event.title}" is confirmed.`
      action = 'auto_confirm'
      break
    case 'waitlisted':
      title = 'Waitlisted'
      message = `You are on the waitlist for "${event.title}".`
      action = 'auto_waitlist'
      break
    case 'booking_canceled':
      title = 'Booking Canceled'
      message = `Your booking for "${event.title}" was canceled.`
      action = 'cancel_confirmed'
      break
    case 'waitlist_promoted':
      title = 'Booking Confirmed!'
      message = `You were promoted from the waitlist for "${event.title}".`
      action = 'promote_from_waitlist'
      break
  }

  // Defer creation to next tick to avoid FK violation
  process.nextTick(async () => {
    await payload.create({
      collection: 'notifications',
      data: { booking: bookingId, user: userId, type, title, message, tenant: tenantId },
      depth: 0,
    })

    await payload.create({
      collection: 'booking-logs',
      data: { booking: bookingId, event: eventId, user: userId, action, note, tenant: tenantId },
      depth: 0,
    })
  })
}

// --- BEFORE CHANGE: set booking status ---
export const bookingStatusBeforeHook: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
}) => {
  const { payload } = req
  if (!payload || !data.event) return data

  // Only auto-assign on CREATE
  if (operation !== 'create') {
    // On update, NEVER recompute; respect the incoming status (e.g. when promoted to confirmed).
    return data
  }

  const event = await payload.findByID({ collection: 'events', id: String(data.event) })
  if (!event) return data

  // Count confirmed bookings
  const { docs: confirmedBookings } = await payload.find({
    collection: 'bookings',
    where: { event: { equals: event.id }, status: { equals: 'confirmed' } },
    limit: 0,
  })

  // Assign status for new booking
  data.status =
    confirmedBookings.length >= (event.capacity || Infinity) ? 'waitlisted' : 'confirmed'
  console.log(`Booking will be ${data.status} for event "${event.title}"`)
  return data
}

// --- AFTER CHANGE: handle notifications, cancel & waitlist promotion ---
export const bookingStatusHook: CollectionAfterChangeHook = async ({
  doc,
  req,
  previousDoc,
  operation,
}) => {
  try {
    const { payload } = req
    if (!payload || !doc) return

    // Ensure we have a valid event ID
    const eventId =
      typeof doc.event === 'object' && doc.event?.id
        ? doc.event.id
        : doc.event || (previousDoc?.event as string | number)

    if (!eventId) {
      console.warn(`No event ID found for booking ${doc.id}, skipping hook.`)
      return
    }

    const event = await payload.findByID({
      collection: 'events',
      id: String(eventId),
    })
    if (!event) return

    // --- CREATED BOOKING ---
    if (operation === 'create') {
      await createNotificationAndLog(payload, {
        booking: doc,
        type: doc.status === 'confirmed' ? 'booking_confirmed' : 'waitlisted',
        user: doc.user,
        event,
        tenant: doc.tenant,
        note:
          doc.status === 'confirmed' ? 'Booking auto-confirmed.' : 'Event full, added to waitlist.',
      })
      return
    }

    // --- UPDATED BOOKING ---
    if (operation === 'update' && previousDoc) {
      // --- CANCELLED confirmed booking ---
      if (doc.status === 'canceled' && previousDoc.status === 'confirmed') {
        await createNotificationAndLog(payload, {
          booking: doc,
          type: 'booking_canceled',
          user: doc.user,
          event,
          tenant: doc.tenant,
          note: 'User canceled booking.',
        })

        // Promote oldest waitlisted
        const { docs: waitlistedBookings } = await payload.find({
          collection: 'bookings',
          where: {
            event: { equals: event.id },
            status: { equals: 'waitlisted' },
          },
          sort: 'createdAt',
          limit: 1,
        })

        if (waitlistedBookings.length > 0) {
          const promote = waitlistedBookings[0]
          const promotedBooking = await payload.update({
            collection: 'bookings',
            id: String(promote.id),
            data: { status: 'confirmed' },
          })
          await createNotificationAndLog(payload, {
            booking: promotedBooking as Booking,
            type: 'waitlist_promoted',
            user: promotedBooking.user,
            event,
            tenant: promotedBooking.tenant,
            note: 'User promoted from waitlist due to cancellation.',
          })
        }
      }

      // --- PROMOTED from waitlist ---
      if (doc.status === 'confirmed' && previousDoc.status === 'waitlisted') {
        await createNotificationAndLog(payload, {
          booking: doc,
          type: 'waitlist_promoted',
          user: doc.user,
          event,
          tenant: doc.tenant,
          note: 'User promoted from waitlist.',
        })
      }

      // --- STATUS CHANGES ---
      if (doc.status !== previousDoc.status) {
        if (doc.status === 'confirmed' && previousDoc.status !== 'confirmed') {
          await createNotificationAndLog(payload, {
            booking: doc,
            type: 'booking_confirmed',
            user: doc.user,
            event,
            tenant: doc.tenant,
            note: 'Booking confirmed.',
          })
        }
        if (doc.status === 'waitlisted' && previousDoc.status !== 'waitlisted') {
          await createNotificationAndLog(payload, {
            booking: doc,
            type: 'waitlisted',
            user: doc.user,
            event,
            tenant: doc.tenant,
            note: 'Added to waitlist.',
          })
        }
      }
    }
  } catch (err) {
    console.error('Error in bookingStatusHook:', err)
  }
}
