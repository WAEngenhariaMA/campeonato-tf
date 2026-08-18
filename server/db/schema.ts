import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow()

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'team'] }).notNull(),
  teamId: uuid('team_id').references(() => teams.id),
  createdAt: createdAt(),
})

export const teams = pgTable('teams', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(), shortName: text('short_name').notNull(), shieldUrl: text('shield_url'),
  login: text('login').notNull().unique(), status: text('status').notNull().default('NAO_INICIADO'),
  seed: integer('seed'), primaryColor: text('primary_color'), secondaryColor: text('secondary_color'),
  active: boolean('active').notNull().default(true), representativesSubmitted: boolean('representatives_submitted').notNull().default(false),
  createdAt: createdAt(),
})

export const players = pgTable('players', {
  id: uuid('id').defaultRandom().primaryKey(), teamId: uuid('team_id').notNull().references(() => teams.id),
  fullName: text('full_name').notNull(), document: text('document').notNull(), documentNormalized: text('document_normalized').notNull(),
  active: boolean('active').notNull().default(true), createdAt: createdAt(),
})

export const coaches = pgTable('coaches', {
  id: uuid('id').defaultRandom().primaryKey(), teamId: uuid('team_id').notNull().references(() => teams.id),
  fullName: text('full_name').notNull(), document: text('document').notNull(), documentNormalized: text('document_normalized').notNull(),
  active: boolean('active').notNull().default(true), createdAt: createdAt(),
})

/** Índice único compartilhado entre atletas e comissão técnica. */
export const registeredDocuments = pgTable('registered_documents', {
  documentNormalized: text('document_normalized').primaryKey(), teamId: uuid('team_id').notNull().references(() => teams.id),
  kind: text('kind', { enum: ['player', 'coach'] }).notNull(), recordId: uuid('record_id').notNull(),
})

export const representatives = pgTable('representative_registrations', {
  teamId: uuid('team_id').primaryKey().references(() => teams.id), rep1Name: text('rep1_name').notNull(), rep1Phone: text('rep1_phone').notNull(),
  rep2Name: text('rep2_name').notNull(), rep2Phone: text('rep2_phone').notNull(), status: text('status').notNull().default('PENDENTE'), createdAt: createdAt(),
})

export const championshipConfig = pgTable('championship_config', {
  id: integer('id').primaryKey().default(1), name: text('name').notNull(), season: text('season').notNull(), logoUrl: text('logo_url'),
  sponsors: jsonb('sponsors').notNull().default([]), registrationsOpen: boolean('registrations_open').notNull().default(true),
  playerLimit: integer('player_limit').notNull().default(20), coachLimit: integer('coach_limit').notNull().default(2),
  representativeLimit: integer('representative_limit').notNull().default(2), teamCount: integer('team_count').notNull().default(10),
})

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(), userId: uuid('user_id'), userLabel: text('user_label').notNull(), action: text('action').notNull(),
  entity: text('entity').notNull(), entityId: text('entity_id').notNull(), oldValue: jsonb('old_value'), newValue: jsonb('new_value'), createdAt: createdAt(),
})
