import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Pin, Layers, MoreVertical, Edit, Trash2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateCanvasModal } from './CreateCanvasModal';
import ShareModal from './ShareModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Canvas {
  id: string;
  title: string;
  image_url: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface CanvasGridProps {
  searchQuery: string;
  sortBy: 'date' | 'name' | 'pins';
  canvases: Canvas[];
  onCanvasesChange: (canvases: Canvas[]) => void;
}

export const CanvasGrid: React.FC<CanvasGridProps> = ({ 
  searchQuery, 
  sortBy, 
  canvases, 
  onCanvasesChange 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteCanvasId, setDeleteCanvasId] = useState<string | null>(null);
  const [shareModalCanvas, setShareModalCanvas] = useState<Canvas | null>(null);

  const filteredAndSortedCanvases = canvases
    .filter(canvas => 
      canvas.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'pins':
          // TODO: Add pin count to canvas data
          return 0;
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const handleCreateCanvas = async (canvasData: { title: string; imageUrl?: string }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('canvases')
        .insert({
          title: canvasData.title,
          image_url: canvasData.imageUrl || '/placeholder.svg',
          owner_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "캔버스 생성됨",
        description: "새 캔버스가 성공적으로 생성되었습니다.",
      });

      onCanvasesChange([data, ...canvases]);
      setIsCreateModalOpen(false);
    } catch (error: any) {
      toast({
        title: "캔버스 생성 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCanvas = async (canvasId: string) => {
    try {
      const { error } = await supabase
        .from('canvases')
        .delete()
        .eq('id', canvasId);

      if (error) throw error;

      toast({
        title: "캔버스 삭제됨",
        description: "캔버스가 성공적으로 삭제되었습니다.",
      });

      onCanvasesChange(canvases.filter(canvas => canvas.id !== canvasId));
      setDeleteCanvasId(null);
    } catch (error: any) {
      toast({
        title: "삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCanvasClick = (canvasId: string) => {
    navigate(`/canvas/${canvasId}`);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const isOwner = (canvas: Canvas) => canvas.owner_id === user?.id;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create New Canvas Card */}
        <Card 
          className="border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer transition-colors group"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <CardContent className="flex flex-col items-center justify-center h-48 text-gray-500 group-hover:text-gray-600">
            <Plus className="w-12 h-12 mb-4" />
            <p className="text-lg font-medium">새 캔버스 만들기</p>
            <p className="text-sm text-center mt-2">이미지를 업로드하거나<br />빈 캔버스를 시작하세요</p>
          </CardContent>
        </Card>

        {/* Existing Canvases */}
        {filteredAndSortedCanvases.map((canvas) => (
          <ContextMenu key={canvas.id}>
            <ContextMenuTrigger>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow group relative">
                <div className="relative">
                  <img
                    src={canvas.image_url}
                    alt={canvas.title}
                    className="w-full h-32 object-cover rounded-t-lg"
                    onClick={() => handleCanvasClick(canvas.id)}
                  />
                  {/* Owner Badge */}
                  {!isOwner(canvas) && (
                    <Badge 
                      variant="secondary" 
                      className="absolute top-2 left-2 bg-blue-100 text-blue-800"
                    >
                      공유됨
                    </Badge>
                  )}
                  {/* Menu Button */}
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 bg-white/80 hover:bg-white/90 backdrop-blur-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCanvasClick(canvas.id)}>
                          <Edit className="w-4 h-4 mr-2" />
                          열기
                        </DropdownMenuItem>
                        {isOwner(canvas) && (
                          <>
                            <DropdownMenuItem onClick={() => setShareModalCanvas(canvas)}>
                              <Share2 className="w-4 h-4 mr-2" />
                              공유
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeleteCanvasId(canvas.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              삭제
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardHeader className="pb-2" onClick={() => handleCanvasClick(canvas.id)}>
                  <CardTitle className="text-lg">{canvas.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0" onClick={() => handleCanvasClick(canvas.id)}>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Pin className="w-4 h-4" />
                        <span>0</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Layers className="w-4 h-4" />
                        <span>0</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(canvas.created_at)}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {isOwner(canvas) ? '내 캔버스' : '공유됨'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => handleCanvasClick(canvas.id)}>
                <Edit className="w-4 h-4 mr-2" />
                열기
              </ContextMenuItem>
              {isOwner(canvas) && (
                <>
                  <ContextMenuItem onClick={() => setShareModalCanvas(canvas)}>
                    <Share2 className="w-4 h-4 mr-2" />
                    공유
                  </ContextMenuItem>
                  <ContextMenuItem 
                    onClick={() => setDeleteCanvasId(canvas.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    삭제
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>

      {/* Create Canvas Modal */}
      <CreateCanvasModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCanvas}
      />

      {/* Share Modal */}
      {shareModalCanvas && (
        <ShareModal
          isOpen={!!shareModalCanvas}
          onClose={() => setShareModalCanvas(null)}
          canvasId={shareModalCanvas.id}
          canvasTitle={shareModalCanvas.title}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCanvasId} onOpenChange={() => setDeleteCanvasId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>캔버스 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 캔버스와 모든 핀, 레이어 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteCanvasId && handleDeleteCanvas(deleteCanvasId)}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
