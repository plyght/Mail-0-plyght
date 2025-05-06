import { themes } from '@zero/db/schema';
import { themeConfigSchema } from '@/types/theme-config';
import { createRateLimiterMiddleware, privateProcedure, publicProcedure, router } from '../trpc';
import { Ratelimit } from '@upstash/ratelimit';
import { TRPCError } from '@trpc/server';
import { eq, and, desc, asc } from 'drizzle-orm';
import { z } from 'zod';

export const themeRouter = router({
  // Get all themes for the current user
  getUserThemes: privateProcedure
    .use(
      createRateLimiterMiddleware({
        limiter: Ratelimit.slidingWindow(60, '1m'),
        generatePrefix: ({ session }) => `ratelimit:get-user-themes-${session?.user.id}`,
      }),
    )
    .query(async ({ ctx }) => {
      const { db, session } = ctx;
      const result = await db
        .select()
        .from(themes)
        .where(eq(themes.userId, session.user.id))
        .orderBy(desc(themes.updatedAt));

      return { themes: result };
    }),

  // Get a theme by ID
  getTheme: privateProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const [result] = await db
        .select()
        .from(themes)
        .where(
          and(
            eq(themes.id, input.id),
            eq(themes.userId, session.user.id),
          ),
        )
        .limit(1);

      if (!result) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Theme not found',
        });
      }

      return { theme: result };
    }),

  // Get public themes
  getPublicThemes: publicProcedure
    .use(
      createRateLimiterMiddleware({
        limiter: Ratelimit.slidingWindow(60, '1m'),
        generatePrefix: ({ ip }) => `ratelimit:get-public-themes-${ip}`,
      }),
    )
    .query(async ({ ctx }) => {
      const { db } = ctx;
      const result = await db
        .select()
        .from(themes)
        .where(eq(themes.isPublic, true))
        .orderBy(asc(themes.name));

      return { themes: result };
    }),

  // Create a new theme
  createTheme: privateProcedure
    .input(
      z.object({
        name: z.string().min(1),
        config: themeConfigSchema,
        isPublic: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const timestamp = new Date();
      const id = crypto.randomUUID();

      await db.insert(themes).values({
        id,
        userId: session.user.id,
        name: input.name,
        config: input.config,
        isPublic: input.isPublic,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      return { id };
    }),

  // Update an existing theme
  updateTheme: privateProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        config: themeConfigSchema.optional(),
        isPublic: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const timestamp = new Date();
      const [existingTheme] = await db
        .select()
        .from(themes)
        .where(
          and(
            eq(themes.id, input.id),
            eq(themes.userId, session.user.id),
          ),
        )
        .limit(1);

      if (!existingTheme) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Theme not found',
        });
      }

      const updateData: Record<string, unknown> = { updatedAt: timestamp };
      if (input.name) updateData.name = input.name;
      if (input.config) updateData.config = input.config;
      if (typeof input.isPublic === 'boolean') updateData.isPublic = input.isPublic;

      await db
        .update(themes)
        .set(updateData)
        .where(
          and(
            eq(themes.id, input.id),
            eq(themes.userId, session.user.id),
          ),
        );

      return { success: true };
    }),

  // Delete a theme
  deleteTheme: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const [existingTheme] = await db
        .select()
        .from(themes)
        .where(
          and(
            eq(themes.id, input.id),
            eq(themes.userId, session.user.id),
          ),
        )
        .limit(1);

      if (!existingTheme) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Theme not found',
        });
      }

      await db
        .delete(themes)
        .where(
          and(
            eq(themes.id, input.id),
            eq(themes.userId, session.user.id),
          ),
        );

      return { success: true };
    }),

  // Copy a public theme to user's themes
  copyTheme: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const timestamp = new Date();

      const [sourceTheme] = await db
        .select()
        .from(themes)
        .where(
          and(
            eq(themes.id, input.id),
            eq(themes.isPublic, true),
          ),
        )
        .limit(1);

      if (!sourceTheme) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Public theme not found',
        });
      }

      const newId = crypto.randomUUID();
      await db.insert(themes).values({
        id: newId,
        userId: session.user.id,
        name: `Copy of ${sourceTheme.name}`,
        config: sourceTheme.config,
        isPublic: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      return { id: newId };
    }),
});