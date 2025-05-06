'use client';

import { useTRPC } from '@/providers/query-provider';
import { useEffect, useState } from 'react';
import { useSettings } from './use-settings';
import { useSession } from '@/lib/auth-client';
import { useTheme } from 'next-themes';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ThemeConfig } from '@/types/theme-config';
import { defaultLightThemeConfig, defaultDarkThemeConfig } from '@/types/theme-config';

// Build CSS variables string from theme config
const buildThemeVars = (config: ThemeConfig, mode: 'light' | 'dark') => {
  const { colors, advanced } = config;
  let cssVars = '';

  // Add color variables - preserve the naming structure that shadcn/ui uses
  Object.entries(colors).forEach(([key, value]) => {
    cssVars += `--${key}: ${value};\n`;
  });

  // Add advanced options if present
  if (advanced) {
    if (advanced.radius) cssVars += `--radius: ${advanced.radius};\n`;
    if (advanced.blur) cssVars += `--blur: ${advanced.blur};\n`;
    if (advanced.shadow) cssVars += `--shadow: ${advanced.shadow};\n`;
    if (advanced.fontFamily) cssVars += `--font-family: ${advanced.fontFamily};\n`;
    if (advanced.fontSizeBase) cssVars += `--font-size-base: ${advanced.fontSizeBase};\n`;
  }

  return cssVars;
};

// Local storage keys
const THEME_CACHE_KEY = 'mail0-theme-cache';
const THEME_CSS_VARS_KEY = 'mail0-theme-css-vars';

export function useThemes() {
  const { data: session } = useSession();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: settingsData } = useSettings();
  const { resolvedTheme, setTheme } = useTheme();
  const [hasInjectedVars, setHasInjectedVars] = useState(false);

  // Query to fetch user themes
  const themesQuery = useQuery(
    trpc.theme.getUserThemes.queryOptions(void 0, {
      enabled: !!session?.user.id,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
  );

  // Query to fetch active theme if one is set
  const activeThemeQuery = useQuery(
    trpc.theme.getTheme.queryOptions(
      { id: settingsData?.settings.activeThemeId || '' },
      {
        enabled: !!settingsData?.settings.activeThemeId,
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    ),
  );

  // Mutations for theme operations
  const createThemeMutation = useMutation({
    ...trpc.theme.createTheme.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['theme', 'getUserThemes']] });
      toast.success('Theme created successfully');
    },
  });

  const updateThemeMutation = useMutation({
    ...trpc.theme.updateTheme.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['theme', 'getUserThemes']] });
      if (settingsData?.settings.activeThemeId) {
        queryClient.invalidateQueries({ 
          queryKey: [['theme', 'getTheme'], { id: settingsData.settings.activeThemeId }] 
        });
      }
      toast.success('Theme updated successfully');
    },
  });

  const deleteThemeMutation = useMutation({
    ...trpc.theme.deleteTheme.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['theme', 'getUserThemes']] });
      toast.success('Theme deleted successfully');
    },
  });

  const saveSettings = useMutation(trpc.settings.save.mutationOptions());

  // Function to apply a theme
  const applyTheme = async (themeId: string | null) => {
    try {
      if (settingsData?.settings) {
        await saveSettings.mutateAsync({
          ...settingsData.settings,
          activeThemeId: themeId,
        });
        
        queryClient.invalidateQueries({ queryKey: [['settings', 'get']] });
        if (themeId) {
          toast.success('Theme applied successfully');
        } else {
          toast.success('Reverted to default theme');
        }
      }
    } catch (error) {
      console.error('Failed to apply theme:', error);
      toast.error('Failed to apply theme');
    }
  };

  // Cache theme in localStorage when user ID changes or when active theme changes
  useEffect(() => {
    if (!session?.user.id) return;

    const cacheKey = `${THEME_CACHE_KEY}-${session.user.id}`;
    
    // Cache the active theme
    if (activeThemeQuery.data?.theme) {
      localStorage.setItem(cacheKey, JSON.stringify(activeThemeQuery.data.theme));
    } else if (settingsData?.settings.activeThemeId === null) {
      localStorage.removeItem(cacheKey);
    }
  }, [session?.user.id, activeThemeQuery.data, settingsData?.settings.activeThemeId]);

  // Apply theme CSS variables
  useEffect(() => {
    if (!document || hasInjectedVars) return;

    // Apply theme CSS variables based on current theme
    const applyThemeVars = () => {
      let themeConfig: ThemeConfig;
      const currentMode = resolvedTheme as 'light' | 'dark' || 'light';
      
      // Get appropriate theme config
      if (activeThemeQuery.data?.theme) {
        themeConfig = activeThemeQuery.data.theme.config;
      } else {
        // Use default theme config based on current color mode
        themeConfig = currentMode === 'dark' ? defaultDarkThemeConfig : defaultLightThemeConfig;
      }

      // Create the CSS variables
      const cssVars = buildThemeVars(themeConfig, currentMode);

      // Inject CSS variables using shadcn/ui approach
      const styleId = 'mail0-theme-vars';
      let style = document.getElementById(styleId) as HTMLStyleElement;
      
      if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        document.head.appendChild(style);
      }

      // Apply to the appropriate selector based on current theme mode
      // This follows the shadcn approach where styles are applied to :root and .dark
      const selector = currentMode === 'dark' ? '.dark' : ':root';
      style.innerHTML = `${selector} {\n${cssVars}}\n`;
      
      // Store in localStorage for quick access
      localStorage.setItem(THEME_CSS_VARS_KEY, cssVars);
      
      setHasInjectedVars(true);
    };

    // Apply theme variables
    applyThemeVars();
  }, [activeThemeQuery.data, resolvedTheme, hasInjectedVars]);

  // Reset theme vars flag when theme changes
  useEffect(() => {
    if (resolvedTheme) {
      setHasInjectedVars(false);
    }
  }, [resolvedTheme]);

  return {
    themes: themesQuery.data?.themes || [],
    activeTheme: activeThemeQuery.data?.theme,
    isLoading: themesQuery.isLoading || activeThemeQuery.isLoading,
    createTheme: createThemeMutation.mutateAsync,
    updateTheme: updateThemeMutation.mutateAsync,
    deleteTheme: deleteThemeMutation.mutateAsync,
    applyTheme,
  };
}