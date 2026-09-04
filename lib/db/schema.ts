import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const signalLabelEnum = pgEnum("signal_label", [
  "launch",
  "feature",
  "noise",
]);

export const alertStatusEnum = pgEnum("alert_status", [
  "new",
  "seen",
  "dismissed",
]);

export const industries = pgTable("industries", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const competitors = pgTable(
  "competitors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    industryId: uuid("industry_id")
      .notNull()
      .references(() => industries.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    xUsername: text("x_username").notNull().unique(),
    xUserId: text("x_user_id"),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("competitors_industry_id_active_idx").on(
      table.industryId,
      table.active,
    ),
  ],
);

export const watchKeywords = pgTable("watch_keywords", {
  id: uuid("id").defaultRandom().primaryKey(),
  industryId: uuid("industry_id")
    .notNull()
    .references(() => industries.id, { onDelete: "cascade" }),
  phrase: text("phrase").notNull(),
  weight: doublePrecision("weight").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const rawPosts = pgTable(
  "raw_posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    xPostId: text("x_post_id").notNull().unique(),
    competitorId: uuid("competitor_id").references(() => competitors.id, {
      onDelete: "set null",
    }),
    text: text("text").notNull(),
    url: text("url").notNull(),
    authorUsername: text("author_username").notNull(),
    postedAt: timestamp("posted_at", { withTimezone: true }).notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    rawJson: jsonb("raw_json")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
  },
  (table) => [index("raw_posts_posted_at_idx").on(table.postedAt)],
);

export const signals = pgTable("signals", {
  id: uuid("id").defaultRandom().primaryKey(),
  rawPostId: uuid("raw_post_id")
    .notNull()
    .unique()
    .references(() => rawPosts.id, { onDelete: "cascade" }),
  score: doublePrecision("score").notNull(),
  label: signalLabelEnum("label").notNull(),
  summary: text("summary").notNull(),
  rationale: text("rationale").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    signalId: uuid("signal_id")
      .notNull()
      .unique()
      .references(() => signals.id, { onDelete: "cascade" }),
    status: alertStatusEnum("status").default("new").notNull(),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("alerts_status_created_at_idx").on(table.status, table.createdAt),
  ],
);

export const digests = pgTable("digests", {
  id: uuid("id").defaultRandom().primaryKey(),
  industryId: uuid("industry_id")
    .notNull()
    .references(() => industries.id, { onDelete: "cascade" }),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  bodyMd: text("body_md").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const appSettings = pgTable(
  "app_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    industryId: uuid("industry_id")
      .notNull()
      .references(() => industries.id, { onDelete: "cascade" }),
    scoreThreshold: doublePrecision("score_threshold").default(0.65).notNull(),
    cronNotes: text("cron_notes").default("").notNull(),
    quietHoursStart: text("quiet_hours_start"),
    quietHoursEnd: text("quiet_hours_end"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("app_settings_industry_id_idx").on(table.industryId)],
);

export const industriesRelations = relations(industries, ({ many, one }) => ({
  competitors: many(competitors),
  keywords: many(watchKeywords),
  digests: many(digests),
  settings: one(appSettings, {
    fields: [industries.id],
    references: [appSettings.industryId],
  }),
}));

export const competitorsRelations = relations(competitors, ({ one, many }) => ({
  industry: one(industries, {
    fields: [competitors.industryId],
    references: [industries.id],
  }),
  posts: many(rawPosts),
}));

export const watchKeywordsRelations = relations(watchKeywords, ({ one }) => ({
  industry: one(industries, {
    fields: [watchKeywords.industryId],
    references: [industries.id],
  }),
}));

export const rawPostsRelations = relations(rawPosts, ({ one }) => ({
  competitor: one(competitors, {
    fields: [rawPosts.competitorId],
    references: [competitors.id],
  }),
  signal: one(signals, {
    fields: [rawPosts.id],
    references: [signals.rawPostId],
  }),
}));

export const signalsRelations = relations(signals, ({ one }) => ({
  rawPost: one(rawPosts, {
    fields: [signals.rawPostId],
    references: [rawPosts.id],
  }),
  alert: one(alerts, {
    fields: [signals.id],
    references: [alerts.signalId],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  signal: one(signals, {
    fields: [alerts.signalId],
    references: [signals.id],
  }),
}));

export const digestsRelations = relations(digests, ({ one }) => ({
  industry: one(industries, {
    fields: [digests.industryId],
    references: [industries.id],
  }),
}));

export const appSettingsRelations = relations(appSettings, ({ one }) => ({
  industry: one(industries, {
    fields: [appSettings.industryId],
    references: [industries.id],
  }),
}));

export type Industry = typeof industries.$inferSelect;
export type Competitor = typeof competitors.$inferSelect;
export type WatchKeywordRow = typeof watchKeywords.$inferSelect;
export type RawPost = typeof rawPosts.$inferSelect;
export type Signal = typeof signals.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type Digest = typeof digests.$inferSelect;
export type AppSettings = typeof appSettings.$inferSelect;
