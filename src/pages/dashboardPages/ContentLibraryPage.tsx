/**
 * Content Library Page
 *
 * View and manage saved content.
 * All data from database - no hardcoding.
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import {
  useContentItems,
  useToggleFavorite,
  useDeleteContent,
  type ContentFilters,
  type ContentType,
} from '@/hooks/queries/useContentLibrary';
import { LoadingSpinner, EmptyState } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Library,
  BookOpen,
  MessageCircle,
  Map,
  StickyNote,
  Mic,
  Star,
  Trash2,
  Filter,
  Heart,
} from 'lucide-react';

const CONTENT_TYPE_INFO: Record<ContentType, { label: string; icon: typeof BookOpen; color: string; gradient: string; border: string }> = {
  story: { label: 'Story', icon: BookOpen, color: 'text-lumi', gradient: 'from-lumi/10 to-lumi/20', border: 'border-lumi/15' },
  journey: { label: 'Journey', icon: Map, color: 'text-lolo', gradient: 'from-lolo/10 to-lolo/20', border: 'border-lolo/15' },
  voice: { label: 'Voice', icon: Mic, color: 'text-gold', gradient: 'from-gold/10 to-lala/10', border: 'border-gold/15' },
  chat_snippet: { label: 'Chat', icon: MessageCircle, color: 'text-primary', gradient: 'from-primary/10 to-primary/20', border: 'border-primary/15' },
  note: { label: 'Note', icon: StickyNote, color: 'text-lala', gradient: 'from-lala/10 to-lumi/10', border: 'border-lala/15' },
};

export function ContentLibraryPage() {
  const { user } = useAuth();
  const { data: children = [] } = useChildProfiles(user?.id);
  const [selectedChildId, setSelectedChildId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<ContentType | 'all'>('all');
  const [showFavorites, setShowFavorites] = useState(false);

  // Build filters
  const filters: ContentFilters = {
    childId: selectedChildId !== 'all' ? selectedChildId : undefined,
    type: selectedType !== 'all' ? selectedType : undefined,
    favorite: showFavorites || undefined,
    limit: 50,
  };

  const { data: contentData, isLoading } = useContentItems(filters);
  const toggleFavorite = useToggleFavorite();
  const deleteContent = useDeleteContent();

  const handleToggleFavorite = (id: string) => {
    toggleFavorite.mutate(id);
  };

  const handleDelete = (id: string) => {
    deleteContent.mutate(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h3 font-bold">Content Library</h1>
          <p className="text-muted-foreground mt-1">
            Stories, journeys, voice recordings, and saved notes.
          </p>
        </div>

        <div className="flex gap-2">
          {children.length > 0 && (
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All children" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All children</SelectItem>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            variant={showFavorites ? 'default' : 'outline'}
            size="icon"
            onClick={() => setShowFavorites(!showFavorites)}
          >
            <Heart className={showFavorites ? 'fill-current' : ''} />
          </Button>
        </div>
      </div>

      {/* Content Type Tabs */}
      <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as ContentType | 'all')}>
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Library className="h-4 w-4" />
            All
            {contentData && (
              <Badge variant="secondary" className="ml-1">
                {contentData.total}
              </Badge>
            )}
          </TabsTrigger>
          {Object.entries(CONTENT_TYPE_INFO).map(([type, info]) => (
            <TabsTrigger key={type} value={type} className="gap-2">
              <info.icon className={`h-4 w-4 ${info.color}`} />
              {info.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedType} className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : !contentData?.items.length ? (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={Library}
                  title="No saved content"
                  description={
                    showFavorites
                      ? 'Mark content as favorite to see it here.'
                      : 'Create stories, start journeys, or record voice clips to see them here.'
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {contentData.items.map((item) => {
                const typeInfo = CONTENT_TYPE_INFO[item.content_type] ?? { label: item.content_type, icon: Library, color: 'text-muted-foreground', gradient: 'from-muted/10 to-muted/20', border: 'border-border' };
                const TypeIcon = typeInfo.icon;

                return (
                  <Card key={item.id} className={`overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br ${typeInfo.gradient} border ${typeInfo.border}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <TypeIcon className={`h-4 w-4 ${typeInfo.color}`} />
                          <Badge variant="secondary" className="text-caption">
                            {typeInfo.label}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleFavorite(item.id)}
                            disabled={toggleFavorite.isPending}
                          >
                            <Star
                              className={`h-4 w-4 ${
                                item.is_favorite ? 'fill-lala text-lala' : ''
                              }`}
                            />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete content?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{item.title}". This action cannot
                                  be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(item.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <CardTitle className="text-body mt-2 line-clamp-1">
                        {item.title}
                      </CardTitle>
                      {item.child_name && (
                        <CardDescription className="text-caption">
                          For {item.child_name}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-body-sm text-muted-foreground line-clamp-3">
                        {item.content}
                      </p>
                      {/* Extra metadata for specific types */}
                      {item.content_type === 'journey' && item.metadata?.status && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant={item.metadata.status === 'completed' ? 'default' : 'secondary'}
                            className="text-caption"
                          >
                            {item.metadata.status === 'completed' ? 'Completed' : item.metadata.status === 'active' ? 'Active' : String(item.metadata.status)}
                          </Badge>
                          {typeof item.metadata.step_count === 'number' && item.metadata.step_count > 0 && (
                            <span className="text-caption text-muted-foreground">
                              {item.metadata.step_count} steps
                            </span>
                          )}
                        </div>
                      )}
                      {item.content_type === 'voice' && (
                        <div className="flex items-center gap-2 mt-2">
                          {item.metadata?.category && (
                            <Badge variant="outline" className="text-caption capitalize">
                              {String(item.metadata.category)}
                            </Badge>
                          )}
                          {typeof item.metadata?.duration_seconds === 'number' && (
                            <span className="text-caption text-muted-foreground">
                              {Math.floor(Number(item.metadata.duration_seconds) / 60)}:{String(Number(item.metadata.duration_seconds) % 60).padStart(2, '0')}
                            </span>
                          )}
                        </div>
                      )}
                      {item.content_type === 'story' && item.metadata?.theme && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-caption capitalize">
                            {String(item.metadata.theme)}
                          </Badge>
                          {typeof item.metadata?.word_count === 'number' && (
                            <span className="text-caption text-muted-foreground">
                              {item.metadata.word_count} words
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-caption text-muted-foreground mt-3">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
