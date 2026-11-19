import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull().default('Patient'),
  role: text('role').notNull().default('patient'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const specialists = pgTable('specialists', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  credentials: text('credentials').notNull(),
  specialty: text('specialty').notNull(),
  department: text('department').notNull(),
  clinicLocation: text('clinic_location').notNull(),
  bio: text('bio').notNull(),
  education: text('education').notNull(),
  languages: text('languages').notNull(),
  yearsExperience: integer('years_experience').notNull(),
  consultationMinutes: integer('consultation_minutes').notNull().default(30),
  rating: text('rating').notNull(),
  acceptsTelehealth: boolean('accepts_telehealth').notNull().default(true),
  avatarUrl: text('avatar_url'),
  insurancesAccepted: text('insurances_accepted').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const clinicSlots = pgTable('clinic_slots', {
  id: serial('id').primaryKey(),
  specialistId: integer('specialist_id')
    .references(() => specialists.id)
    .notNull(),
  slotDate: text('slot_date').notNull(),
  slotTime: text('slot_time').notNull(),
  isAiRecommended: boolean('is_ai_recommended').notNull().default(false),
  isBlocked: boolean('is_blocked').notNull().default(false),
  visitMode: text('visit_mode').notNull().default('both'),
});

export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  referenceCode: text('reference_code').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  specialistId: integer('specialist_id')
    .references(() => specialists.id)
    .notNull(),
  slotDate: text('slot_date').notNull(),
  slotTime: text('slot_time').notNull(),
  visitType: text('visit_type').notNull().default('In-Person'),
  status: text('status').notNull().default('Confirmed'),
  reason: text('reason').notNull(),
  triageUrgency: text('triage_urgency').notNull().default('Routine'),
  prepNotes: text('prep_notes'),
  vitalsPrecheck: text('vitals_precheck'),
  checkInStatus: text('check_in_status').notNull().default('Scheduled'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const patientProfiles = pgTable('patient_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull()
    .unique(),
  fullName: text('full_name').notNull(),
  dateOfBirth: text('date_of_birth').notNull().default('1990-05-14'),
  phone: text('phone').notNull().default('+1 (415) 555-0192'),
  bloodType: text('blood_type').notNull().default('O+'),
  allergies: text('allergies').notNull().default('None reported'),
  medications: text('medications').notNull().default('None reported'),
  conditions: text('conditions').notNull().default('None reported'),
  emergencyContactName: text('emergency_contact_name').notNull().default(''),
  emergencyContactPhone: text('emergency_contact_phone').notNull().default(''),
  insuranceCarrier: text('insurance_carrier').notNull().default('BlueCross BlueShield'),
  insurancePlan: text('insurance_plan').notNull().default('PPO Gold Select'),
  memberId: text('member_id').notNull().default('BCBS-8841209'),
  groupNumber: text('group_number').notNull().default('GRP-44021'),
  copayAmount: text('copay_amount').notNull().default('$25'),
  coverageStatus: text('coverage_status').notNull().default('Verified'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const triageAssessments = pgTable('triage_assessments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  symptoms: text('symptoms').notNull(),
  duration: text('duration').notNull(),
  severity: text('severity').notNull(),
  recommendedSpecialty: text('recommended_specialty').notNull(),
  urgencyLevel: text('urgency_level').notNull(),
  aiSummary: text('ai_summary').notNull(),
  prepChecklist: text('prep_checklist').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const careMessages = pgTable('care_messages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  specialistId: integer('specialist_id').references(() => specialists.id),
  senderRole: text('sender_role').notNull(),
  senderName: text('sender_name').notNull(),
  body: text('body').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  appointments: many(appointments),
  profile: one(patientProfiles, {
    fields: [users.id],
    references: [patientProfiles.userId],
  }),
  triageAssessments: many(triageAssessments),
  careMessages: many(careMessages),
}));

export const specialistsRelations = relations(specialists, ({ many }) => ({
  slots: many(clinicSlots),
  appointments: many(appointments),
}));

export const clinicSlotsRelations = relations(clinicSlots, ({ one }) => ({
  specialist: one(specialists, {
    fields: [clinicSlots.specialistId],
    references: [specialists.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(users, {
    fields: [appointments.userId],
    references: [users.id],
  }),
  specialist: one(specialists, {
    fields: [appointments.specialistId],
    references: [specialists.id],
  }),
}));
