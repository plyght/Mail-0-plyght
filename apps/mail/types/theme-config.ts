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

// Default theme configuration based on the current light theme
export const defaultLightThemeConfig: ThemeConfig = {
  colors: {
    background: '0 0% 100%',
    foreground: '240 10% 3.9%',
    card: '0 0% 100%',
    'card-foreground': '240 10% 3.9%',
    popover: '0 0% 100%',
    'popover-foreground': '240 10% 3.9%',
    primary: '240 5.9% 10%',
    'primary-foreground': '0 0% 98%',
    secondary: '240 4.8% 95.9%',
    'secondary-foreground': '240 5.9% 10%',
    muted: '240 4.8% 95.9%',
    'muted-foreground': '240 3.8% 46.1%',
    accent: '240 4.8% 95.9%',
    'accent-foreground': '240 5.9% 10%',
    destructive: '0 84.2% 60.2%',
    'destructive-foreground': '0 0% 98%',
    border: '240 5.9% 90%',
    input: '240 5.9% 90%',
    ring: '240 10% 3.9%',
  },
  advanced: {
    radius: '0.5rem',
  },
};

// Default theme configuration based on the current dark theme
export const defaultDarkThemeConfig: ThemeConfig = {
  colors: {
    background: '240 10% 3.9%',
    foreground: '0 0% 98%',
    card: '240 5.9% 10%',
    'card-foreground': '0 0% 98%',
    popover: '240 3.4% 8%',
    'popover-foreground': '0 0% 99%',
    primary: '0 0% 98%',
    'primary-foreground': '240 5.9% 10%',
    secondary: '240 3.7% 15.9%',
    'secondary-foreground': '0 0% 98%',
    muted: '240 3.7% 15.9%',
    'muted-foreground': '240 5% 64.9%',
    accent: '240 3.7% 15.9%',
    'accent-foreground': '0 0% 98%',
    destructive: '0 62.8% 30.6%',
    'destructive-foreground': '0 0% 98%',
    border: '240 3.7% 20%',
    input: '240 3.7% 15.9%',
    ring: '240 4.9% 83.9%',
  },
  advanced: {
    radius: '0.5rem',
  },
};

export type ThemeConfig = z.infer<typeof themeConfigSchema>;