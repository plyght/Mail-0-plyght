'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { defaultLightThemeConfig, defaultDarkThemeConfig } from '@/types/theme-config';
import { ChevronDown, Copy, Eye, Import, Pencil, Plus, RefreshCw, Save } from 'lucide-react';
import { useThemes } from '@/hooks/use-themes';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import type { ThemeConfig } from '@/types/theme-config';

interface ColorSectionProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  preview?: string;
}

const ColorSection = ({ title, value, onChange, preview }: ColorSectionProps) => {
  return (
    <div className="grid gap-2">
      <Label>{title}</Label>
      <div className="flex gap-2 items-center">
        <Input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1" />
        <Input 
          type="color" 
          value={hslToHex(value)} 
          onChange={(e) => onChange(hexToHsl(e.target.value))}
          className="w-10 h-10 p-1 cursor-pointer" 
        />
        {preview && (
          <div 
            className="w-10 h-10 rounded border"
            style={{ background: `hsl(${value})`, color: `hsl(${preview})` }}
          >
            <span className="flex h-full items-center justify-center text-xs font-bold">Aa</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions for color conversion
function hslToHex(hslValue: string): string {
  const [h, s, l] = hslValue.split(' ').map(v => parseFloat(v.replace('%', '')));
  const hDecimal = h / 360;
  const sDecimal = s / 100;
  const lDecimal = l / 100;
  
  let r, g, b;
  if (s === 0) {
    r = g = b = lDecimal;
  } else {
    const q = lDecimal < 0.5 ? lDecimal * (1 + sDecimal) : lDecimal + sDecimal - lDecimal * sDecimal;
    const p = 2 * lDecimal - q;
    r = hueToRgb(p, q, hDecimal + 1/3);
    g = hueToRgb(p, q, hDecimal);
    b = hueToRgb(p, q, hDecimal - 1/3);
  }
  
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hueToRgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1/6) return p + (q - p) * 6 * t;
  if (t < 1/2) return q;
  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
}

function hexToHsl(hex: string): string {
  // Convert hex to RGB first
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16) / 255;
    g = parseInt(hex[2] + hex[2], 16) / 255;
    b = parseInt(hex[3] + hex[3], 16) / 255;
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16) / 255;
    g = parseInt(hex.substring(3, 5), 16) / 255;
    b = parseInt(hex.substring(5, 7), 16) / 255;
  }

  // Find max and min
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  // Calculate h and s
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  // Convert to HSL string format
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

interface ThemeEditorProps {
  themeId?: string;
  defaultName?: string;
  defaultConfig?: ThemeConfig;
  onSave?: (id: string) => void;
  onCancel?: () => void;
}

export function ThemeEditor({ 
  themeId, 
  defaultName = 'My Theme', 
  defaultConfig,
  onSave,
  onCancel,
}: ThemeEditorProps) {
  const { createTheme, updateTheme } = useThemes();
  const { resolvedTheme } = useTheme();
  const [name, setName] = useState(defaultName);
  const [isPublic, setIsPublic] = useState(false);
  const [colors, setColors] = useState<ThemeConfig['colors']>(
    defaultConfig?.colors || 
    (resolvedTheme === 'dark' ? defaultDarkThemeConfig.colors : defaultLightThemeConfig.colors)
  );
  const [advanced, setAdvanced] = useState<ThemeConfig['advanced']>(
    defaultConfig?.advanced || { radius: '0.5rem' }
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<ThemeConfig>({ colors, advanced });

  // Update preview theme when colors or advanced settings change
  useEffect(() => {
    setPreviewTheme({ colors, advanced });
  }, [colors, advanced]);

  // Apply live preview
  useEffect(() => {
    if (!previewOpen) return;

    // Create the CSS variables for preview
    const cssVars = Object.entries(colors)
      .map(([key, value]) => `--${key}: ${value};`)
      .join('\n');

    // Add advanced options
    const advancedVars = advanced
      ? Object.entries(advanced)
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
  }, [previewOpen, colors, advanced]);

  // Save the theme
  const handleSave = async () => {
    try {
      const themeConfig: ThemeConfig = {
        colors,
        advanced,
      };

      let newThemeId = themeId;
      
      if (themeId) {
        // Update existing theme
        await updateTheme({
          id: themeId,
          name,
          config: themeConfig,
          isPublic,
        });
      } else {
        // Create new theme
        const result = await createTheme({
          name,
          config: themeConfig,
          isPublic,
        });
        newThemeId = result.id;
      }

      toast.success(themeId ? 'Theme updated' : 'Theme created');
      if (onSave && newThemeId) {
        onSave(newThemeId);
      }
    } catch (error) {
      console.error('Failed to save theme:', error);
      toast.error('Failed to save theme');
    }
  };

  // Reset to default
  const resetToDefault = () => {
    const defaultConfig = resolvedTheme === 'dark' 
      ? defaultDarkThemeConfig 
      : defaultLightThemeConfig;
    
    setColors(defaultConfig.colors);
    setAdvanced(defaultConfig.advanced);
    toast.success('Reset to default theme');
  };

  // Import JSON
  const importJSON = () => {
    try {
      const input = prompt('Paste your theme JSON:');
      if (!input) return;
      
      const importedTheme = JSON.parse(input) as ThemeConfig;
      if (importedTheme.colors) {
        setColors(importedTheme.colors);
      }
      if (importedTheme.advanced) {
        setAdvanced(importedTheme.advanced);
      }
      toast.success('Theme imported successfully');
    } catch (error) {
      console.error('Failed to import theme:', error);
      toast.error('Invalid theme JSON');
    }
  };

  // Export as JSON
  const exportJSON = () => {
    const themeConfig: ThemeConfig = { colors, advanced };
    const json = JSON.stringify(themeConfig, null, 2);
    
    navigator.clipboard.writeText(json)
      .then(() => toast.success('Theme copied to clipboard'))
      .catch(() => {
        // Fallback if clipboard API fails
        prompt('Copy your theme JSON:', json);
      });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="grid flex-1 gap-2">
          <Label htmlFor="theme-name">Theme Name</Label>
          <Input 
            id="theme-name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="My Custom Theme"
          />
        </div>
        <div className="flex items-center space-x-2 pt-5">
          <Switch 
            id="theme-public" 
            checked={isPublic} 
            onCheckedChange={setIsPublic}
          />
          <Label htmlFor="theme-public">Public</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme Editor</CardTitle>
              <CardDescription>
                Customize your theme colors and appearance
              </CardDescription>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={resetToDefault}>
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Reset
                </Button>
                <Button variant="outline" size="sm" onClick={importJSON}>
                  <Import className="mr-1 h-4 w-4" />
                  Import
                </Button>
                <Button variant="outline" size="sm" onClick={exportJSON}>
                  <Copy className="mr-1 h-4 w-4" />
                  Export
                </Button>
                <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="mr-1 h-4 w-4" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[900px]">
                    <DialogHeader>
                      <DialogTitle>Theme Preview</DialogTitle>
                      <DialogDescription>
                        Preview your theme with different UI components
                      </DialogDescription>
                    </DialogHeader>
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
                          <Switch />
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
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="base">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="base">Base Colors</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
                <TabsContent value="base" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ColorSection 
                      title="Background" 
                      value={colors.background} 
                      onChange={(value) => setColors({...colors, background: value})}
                      preview={colors.foreground}
                    />
                    <ColorSection 
                      title="Foreground" 
                      value={colors.foreground} 
                      onChange={(value) => setColors({...colors, foreground: value})}
                      preview={colors.background}
                    />
                    <ColorSection 
                      title="Card" 
                      value={colors.card} 
                      onChange={(value) => setColors({...colors, card: value})}
                      preview={colors["card-foreground"]}
                    />
                    <ColorSection 
                      title="Card Foreground" 
                      value={colors["card-foreground"]} 
                      onChange={(value) => setColors({...colors, "card-foreground": value})}
                      preview={colors.card}
                    />
                    <ColorSection 
                      title="Primary" 
                      value={colors.primary} 
                      onChange={(value) => setColors({...colors, primary: value})}
                      preview={colors["primary-foreground"]}
                    />
                    <ColorSection 
                      title="Primary Foreground" 
                      value={colors["primary-foreground"]} 
                      onChange={(value) => setColors({...colors, "primary-foreground": value})}
                      preview={colors.primary}
                    />
                    <ColorSection 
                      title="Secondary" 
                      value={colors.secondary} 
                      onChange={(value) => setColors({...colors, secondary: value})}
                      preview={colors["secondary-foreground"]}
                    />
                    <ColorSection 
                      title="Secondary Foreground" 
                      value={colors["secondary-foreground"]} 
                      onChange={(value) => setColors({...colors, "secondary-foreground": value})}
                      preview={colors.secondary}
                    />
                  </div>

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="more-colors">
                      <AccordionTrigger>More Colors</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                          <ColorSection 
                            title="Muted" 
                            value={colors.muted} 
                            onChange={(value) => setColors({...colors, muted: value})}
                            preview={colors["muted-foreground"]}
                          />
                          <ColorSection 
                            title="Muted Foreground" 
                            value={colors["muted-foreground"]} 
                            onChange={(value) => setColors({...colors, "muted-foreground": value})}
                            preview={colors.muted}
                          />
                          <ColorSection 
                            title="Accent" 
                            value={colors.accent} 
                            onChange={(value) => setColors({...colors, accent: value})}
                            preview={colors["accent-foreground"]}
                          />
                          <ColorSection 
                            title="Accent Foreground" 
                            value={colors["accent-foreground"]} 
                            onChange={(value) => setColors({...colors, "accent-foreground": value})}
                            preview={colors.accent}
                          />
                          <ColorSection 
                            title="Destructive" 
                            value={colors.destructive} 
                            onChange={(value) => setColors({...colors, destructive: value})}
                            preview={colors["destructive-foreground"]}
                          />
                          <ColorSection 
                            title="Destructive Foreground" 
                            value={colors["destructive-foreground"]} 
                            onChange={(value) => setColors({...colors, "destructive-foreground": value})}
                            preview={colors.destructive}
                          />
                          <ColorSection 
                            title="Popover" 
                            value={colors.popover} 
                            onChange={(value) => setColors({...colors, popover: value})}
                            preview={colors["popover-foreground"]}
                          />
                          <ColorSection 
                            title="Popover Foreground" 
                            value={colors["popover-foreground"]} 
                            onChange={(value) => setColors({...colors, "popover-foreground": value})}
                            preview={colors.popover}
                          />
                          <ColorSection 
                            title="Border" 
                            value={colors.border} 
                            onChange={(value) => setColors({...colors, border: value})}
                          />
                          <ColorSection 
                            title="Input" 
                            value={colors.input} 
                            onChange={(value) => setColors({...colors, input: value})}
                          />
                          <ColorSection 
                            title="Ring" 
                            value={colors.ring} 
                            onChange={(value) => setColors({...colors, ring: value})}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>
                <TabsContent value="advanced" className="mt-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="radius">Border Radius</Label>
                      <Input 
                        id="radius" 
                        value={advanced?.radius || '0.5rem'} 
                        onChange={(e) => setAdvanced({...advanced, radius: e.target.value})}
                        placeholder="0.5rem"
                      />
                    </div>
                    <div>
                      <Label htmlFor="blur">Blur Amount</Label>
                      <Input 
                        id="blur" 
                        value={advanced?.blur || ''} 
                        onChange={(e) => setAdvanced({...advanced, blur: e.target.value})}
                        placeholder="8px"
                      />
                    </div>
                    <div>
                      <Label htmlFor="shadow">Shadow</Label>
                      <Input 
                        id="shadow" 
                        value={advanced?.shadow || ''} 
                        onChange={(e) => setAdvanced({...advanced, shadow: e.target.value})}
                        placeholder="0 4px 12px rgba(0, 0, 0, 0.1)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="font-family">Font Family</Label>
                      <Input 
                        id="font-family" 
                        value={advanced?.fontFamily || ''} 
                        onChange={(e) => setAdvanced({...advanced, fontFamily: e.target.value})}
                        placeholder="Geist, sans-serif"
                      />
                    </div>
                    <div>
                      <Label htmlFor="font-size">Base Font Size</Label>
                      <Input 
                        id="font-size" 
                        value={advanced?.fontSizeBase || ''} 
                        onChange={(e) => setAdvanced({...advanced, fontSizeBase: e.target.value})}
                        placeholder="1rem"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Theme Preview</CardTitle>
              <CardDescription>
                See your theme in action
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="theme-preview-container rounded-md border p-4 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Button className="w-full">Primary Button</Button>
                  <Button variant="secondary" className="w-full">Secondary</Button>
                  <Button variant="outline" className="w-full">Outline</Button>
                </div>
                <div className="bg-card text-card-foreground rounded-lg border p-3">
                  <h3 className="text-sm font-medium mb-2">Card Component</h3>
                  <p className="text-xs text-muted-foreground">This is how cards will appear</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Input placeholder="Input field" />
                  <div className="flex items-center space-x-2">
                    <Switch id="preview-switch" />
                    <Label htmlFor="preview-switch">Toggle</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave}>
          {themeId ? 'Update Theme' : 'Create Theme'}
        </Button>
      </div>
    </div>
  );
}