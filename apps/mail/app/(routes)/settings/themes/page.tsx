'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeEditor } from '@/components/theme/theme-editor';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTRPC } from '@/providers/query-provider';
import { useThemes } from '@/hooks/use-themes';
import { Eye, Check, Loader2, Copy, PaintBucket, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { Input } from '@/components/ui/input';
import type { ThemeConfig } from '@/types/theme-config';

interface MarketplaceThemeCardProps {
  id: string;
  name: string;
  config: ThemeConfig;
  userId: string;
  onCopy: () => void;
  onPreview: () => void;
}

const MarketplaceThemeCard = ({ 
  id, 
  name, 
  config, 
  userId, 
  onCopy, 
  onPreview 
}: MarketplaceThemeCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{name}</CardTitle>
        <CardDescription className="text-xs">Created by {userId.substring(0, 8)}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex gap-1 flex-wrap">
          <div 
            className="w-6 h-6 rounded-full border" 
            style={{ backgroundColor: `hsl(${config.colors.background})` }}
            title="Background"
          />
          <div 
            className="w-6 h-6 rounded-full border" 
            style={{ backgroundColor: `hsl(${config.colors.primary})` }}
            title="Primary"
          />
          <div 
            className="w-6 h-6 rounded-full border" 
            style={{ backgroundColor: `hsl(${config.colors.secondary})` }}
            title="Secondary"
          />
          <div 
            className="w-6 h-6 rounded-full border" 
            style={{ backgroundColor: `hsl(${config.colors.accent})` }}
            title="Accent"
          />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onPreview}>
          <Eye className="mr-1 h-4 w-4" />
          Preview
        </Button>
        <Button size="sm" className="flex-1" onClick={onCopy}>
          <Copy className="mr-1 h-4 w-4" />
          Copy
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function ThemeMarketplacePage() {
  const trpc = useTRPC();
  const { resolvedTheme } = useTheme();
  const { copyTheme } = useThemes();
  const [search, setSearch] = useState('');
  const [previewTheme, setPreviewTheme] = useState<{id: string, name: string, config: ThemeConfig} | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Query to fetch public themes
  const { data, isLoading, error } = useQuery(
    trpc.theme.getPublicThemes.queryOptions(),
  );

  // Handle copy theme
  const handleCopyTheme = async (themeId: string) => {
    try {
      await copyTheme({ id: themeId });
      toast.success("Theme copied to your collection! You can now customize it.");
    } catch (error) {
      console.error('Failed to copy theme:', error);
      toast.error('Failed to copy theme');
    }
  };

  // Handle theme preview
  const handlePreviewTheme = (theme: typeof previewTheme) => {
    setPreviewTheme(theme);
    setPreviewOpen(true);
  };

  // Filter themes by search term
  const filteredThemes = data?.themes?.filter(theme => 
    theme.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  // Apply live preview when previewing a theme
  useState(() => {
    if (!previewOpen || !previewTheme) return;

    // Create the CSS variables for preview
    const cssVars = Object.entries(previewTheme.config.colors)
      .map(([key, value]) => `--${key}: ${value};`)
      .join('\n');

    // Add advanced options
    const advancedVars = previewTheme.config.advanced
      ? Object.entries(previewTheme.config.advanced)
          .filter(([_, value]) => value)
          .map(([key, value]) => `--${key}: ${value};`)
          .join('\n')
      : '';

    // Inject preview CSS variables
    const styleId = 'theme-preview-vars';
    let style = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    // Apply to preview container
    style.innerHTML = `.theme-preview-container {\n${cssVars}\n${advancedVars}\n}`;

    return () => {
      // Clean up preview styles when component unmounts
      if (style) {
        document.head.removeChild(style);
      }
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Theme Marketplace</h2>
        <p className="text-muted-foreground">
          Discover and import themes created by the community
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search themes..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">Failed to load themes. Please try again.</p>
        </div>
      ) : filteredThemes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <PaintBucket className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <h3 className="mt-4 text-lg font-semibold">No themes found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {search 
              ? `No themes match your search "${search}"`
              : "There are no public themes available yet. Create and share your own themes!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredThemes.map((theme) => (
            <MarketplaceThemeCard 
              key={theme.id}
              id={theme.id}
              name={theme.name}
              config={theme.config}
              userId={theme.userId}
              onCopy={() => handleCopyTheme(theme.id)}
              onPreview={() => handlePreviewTheme(theme)}
            />
          ))}
        </div>
      )}

      {previewTheme && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="sm:max-w-[900px]">
            <DialogHeader>
              <DialogTitle>Preview: {previewTheme.name}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              <div className="theme-preview-container rounded-md p-6 border">
                <div className="grid gap-4">
                  <div className="flex gap-2">
                    <Button>Primary Button</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input placeholder="Input field" />
                    <div className="bg-card text-card-foreground rounded-md border p-2">Card</div>
                    <div className="bg-popover text-popover-foreground rounded-md border p-2">Popover</div>
                  </div>
                  <div className="flex gap-2">
                    <div className="bg-muted text-muted-foreground rounded-md border p-2">Muted</div>
                    <div className="bg-accent text-accent-foreground rounded-md border p-2">Accent</div>
                    <div className="bg-secondary text-secondary-foreground rounded-md border p-2">Secondary</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={() => handleCopyTheme(previewTheme.id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy to My Themes
                </Button>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}