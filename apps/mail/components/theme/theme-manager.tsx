'use client';

import { useThemes } from '@/hooks/use-themes';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ThemeEditor } from '@/components/theme/theme-editor';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, ChevronDown, Loader2, MoreHorizontal, PaintBucket, Pencil, Plus, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import type { ThemeConfig } from '@/types/theme-config';

interface ThemeCardProps {
  id: string;
  name: string;
  config: ThemeConfig;
  isPublic: boolean;
  isActive: boolean;
  onApply: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ThemeCard = ({ 
  id, 
  name, 
  config, 
  isPublic, 
  isActive, 
  onApply, 
  onEdit, 
  onDelete 
}: ThemeCardProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <Card className={`transition-all ${isActive ? 'border-2 border-primary' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base">{name}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-destructive focus:text-destructive">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="flex items-center gap-1 text-xs">
          {isPublic ? 'Public' : 'Private'} theme
          {isActive && (
            <>
              <span className="mx-1">•</span>
              <span className="flex items-center text-primary">
                <Check className="mr-1 h-3 w-3" /> Active
              </span>
            </>
          )}
        </CardDescription>
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
      <CardFooter>
        <Button 
          variant={isActive ? "secondary" : "default"} 
          size="sm" 
          className="w-full" 
          onClick={onApply}
        >
          {isActive ? 'Current Theme' : 'Apply Theme'}
        </Button>
      </CardFooter>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the theme "{name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                onDelete();
                setShowDeleteConfirm(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export function ThemeManager() {
  const { themes, activeTheme, isLoading, applyTheme, deleteTheme } = useThemes();
  const { resolvedTheme } = useTheme();
  const [editingTheme, setEditingTheme] = useState<{id: string, name: string, config: ThemeConfig, isPublic: boolean} | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleApplyTheme = async (themeId: string) => {
    try {
      await applyTheme(themeId);
    } catch (error) {
      console.error('Failed to apply theme:', error);
      toast.error('Failed to apply theme');
    }
  };

  const handleResetToDefault = async () => {
    try {
      await applyTheme(null);
    } catch (error) {
      console.error('Failed to reset theme:', error);
      toast.error('Failed to reset theme');
    }
  };

  const handleDeleteTheme = async (themeId: string) => {
    try {
      await deleteTheme({ id: themeId });
      if (activeTheme?.id === themeId) {
        // If the active theme was deleted, reset to default
        await applyTheme(null);
      }
    } catch (error) {
      console.error('Failed to delete theme:', error);
      toast.error('Failed to delete theme');
    }
  };

  const handleEditTheme = (theme: typeof editingTheme) => {
    setEditingTheme(theme);
  };

  const closeEditDialog = () => {
    setEditingTheme(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Theme Manager</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Theme
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px]">
            <DialogHeader>
              <DialogTitle>Create New Theme</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              <div className="p-1">
                <ThemeEditor 
                  onSave={(id) => {
                    setIsCreating(false);
                    toast.success('Theme created! You can now apply it.');
                  }}
                  onCancel={() => setIsCreating(false)}
                />
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Your Themes</h3>
              <Button variant="outline" size="sm" onClick={handleResetToDefault}>
                Reset to Default
              </Button>
            </div>
            
            {themes.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <PaintBucket className="mx-auto h-10 w-10 text-muted-foreground/60" />
                <h3 className="mt-4 text-lg font-semibold">No themes yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create your first theme to customize the appearance of your mail.
                </p>
                <Button className="mt-4" onClick={() => setIsCreating(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Theme
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {themes.map((theme) => (
                  <ThemeCard 
                    key={theme.id}
                    id={theme.id}
                    name={theme.name}
                    config={theme.config}
                    isPublic={theme.isPublic}
                    isActive={activeTheme?.id === theme.id}
                    onApply={() => handleApplyTheme(theme.id)}
                    onEdit={() => handleEditTheme(theme)}
                    onDelete={() => handleDeleteTheme(theme.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {editingTheme && (
        <Dialog open={!!editingTheme} onOpenChange={(open) => !open && closeEditDialog()}>
          <DialogContent className="sm:max-w-[900px]">
            <DialogHeader>
              <DialogTitle>Edit Theme: {editingTheme.name}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              <div className="p-1">
                <ThemeEditor 
                  themeId={editingTheme.id}
                  defaultName={editingTheme.name}
                  defaultConfig={editingTheme.config}
                  onSave={() => {
                    closeEditDialog();
                    toast.success('Theme updated successfully');
                  }}
                  onCancel={closeEditDialog}
                />
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}