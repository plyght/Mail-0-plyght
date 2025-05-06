import * as z from 'zod';

// Base color schema that matches shadcn/ui's theme format
export const themeColorSchema = z.object({
  background: z.string(),
  foreground: z.string(),
  card: z.string(),
  'card-foreground': z.string(),
  popover: z.string(),
  'popover-foreground': z.string(),
  primary: z.string(),
  'primary-foreground': z.string(),
  secondary: z.string(),
  'secondary-foreground': z.string(),
  muted: z.string(),
  'muted-foreground': z.string(),
  accent: z.string(),
  'accent-foreground': z.string(),
  destructive: z.string(),
  'destructive-foreground': z.string(),
  border: z.string(),
  input: z.string(),
  ring: z.string(),
});

// Advanced theme options schema
export const advancedThemeOptionsSchema = z.object({
  radius: z.string().optional(),
  blur: z.string().optional(),
  shadow: z.string().optional(),
  fontFamily: z.string().optional(),
  fontSizeBase: z.string().optional(),
});

// Theme configuration schema
export const themeConfigSchema = z.object({
  colors: themeColorSchema,
  advanced: advancedThemeOptionsSchema.optional(),
});

export type ThemeConfig = z.infer<typeof themeConfigSchema>;