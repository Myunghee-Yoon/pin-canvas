
import React, { useState } from 'react';
import { Plus, ImageIcon, FolderOpen, Palette, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateCanvasModal } from './CreateCanvasModal';
import { CanvasGrid } from './CanvasGrid';

export const Dashboard = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [canvases, setCanvases] = useState([
    {
      id: '1',
      title: '서울 여행 계획',
      imageUrl: '/placeholder.svg',
      createdAt: new Date('2024-06-10'),
      pinCount: 12,
      layerCount: 3,
    },
    {
      id: '2', 
      title: '프로젝트 기획서',
      imageUrl: '/placeholder.svg',
      createdAt: new Date('2024-06-12'),
      pinCount: 8,
      layerCount: 2,
    }
  ]);

  const handleCreateCanvas = (canvasData: any) => {
    const newCanvas = {
      id: String(canvases.length + 1),
      title: canvasData.title,
      imageUrl: canvasData.imageUrl || '/placeholder.svg',
      createdAt: new Date(),
      pinCount: 0,
      layerCount: 1,
    };
    setCanvases([newCanvas, ...canvases]);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                  PinCanvas
                </h1>
                <p className="text-sm text-muted-foreground">시각적 정보 관리 플랫폼</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="gradient-primary text-white border-0 hover:opacity-90 transition-opacity pin-shadow"
              >
                <Plus className="w-4 h-4 mr-2" />
                새 캔버스 만들기
              </Button>
              
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
              
              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/60 backdrop-blur-sm border-0 canvas-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 캔버스</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{canvases.length}</div>
              <p className="text-xs text-muted-foreground">활성 프로젝트</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/60 backdrop-blur-sm border-0 canvas-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 핀</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {canvases.reduce((sum, canvas) => sum + canvas.pinCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">저장된 정보</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/60 backdrop-blur-sm border-0 canvas-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">최근 활동</CardTitle>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {canvases.length > 0 ? '오늘' : '없음'}
              </div>
              <p className="text-xs text-muted-foreground">마지막 수정</p>
            </CardContent>
          </Card>
        </div>

        {/* Canvas Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">내 캔버스</h2>
              <p className="text-muted-foreground">생성한 모든 캔버스를 관리하세요</p>
            </div>
          </div>
          
          <CanvasGrid canvases={canvases} />
        </div>
      </main>

      {/* Create Canvas Modal */}
      <CreateCanvasModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCanvas}
      />
    </div>
  );
};
