import { z } from 'zod'

export const emailSchema = z.object({ email: z.string().email('Invalid email') })
export const passwordSchema = z.object({ password: z.string().min(6, 'Min 6 chars') })
export const contactSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['vendor', 'renter', 'customer', 'other']),
  phone: z.string().min(7).optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  company_name: z.string().optional(),
  gst_number: z.string().optional(),
})
export const inventoryItemSchema = z.object({
  name: z.string().min(2),
  category_id: z.string().optional(),
  unique_code: z.string().optional(),
  company: z.string().optional(),
  model: z.string().optional(),
  scope: z.string().optional(),
  item_type: z.enum(['owned', 'leased']).optional(),
  target_event_types: z.array(z.string()).optional(),
  estimated_rent_price: z.coerce.number().min(0).optional(),
  security_deposit: z.coerce.number().min(0).optional(),
  total_quantity: z.coerce.number().min(0),
  unit: z.string().optional(),
  location_id: z.string().optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
})
export const pricingRateSchema = z.object({
  rental_type: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'per_event']),
  rate: z.coerce.number().min(0),
  security_deposit: z.coerce.number().min(0).optional(),
  applicable_days: z.array(z.number()).optional(),
})
export const eventSchema = z.object({
  name: z.string().min(2),
  client_id: z.string(),
  event_type: z.string(),
  start_datetime: z.string(),
  end_datetime: z.string().optional(),
  venue: z.string().optional(),
  status: z.string().optional(),
})
export const quoteSchema = z.object({
  client_id: z.string(),
  event_type: z.string(),
  event_start_date: z.string(),
  event_end_date: z.string(),
  venue: z.string().optional(),
})
export const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01),
  payment_date: z.string(),
  payment_method: z.enum(['cash', 'bank_transfer', 'upi', 'cheque', 'card']),
  category: z.enum(['rental_income', 'rental_expense', 'wages', 'advance', 'refund', 'other']),
})
