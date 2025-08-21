import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Grid, LogOut, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { CanvasGrid } from './CanvasGrid';
import { CreateCanvasModal } from './CreateCanvasModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Canvas {
  id: string;
  title: string;
  image_url: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export const Dashboard: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'pins'>('date');
  const [canvasesLoading, setCanvasesLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }

    loadCanvases();
  }, [user, loading, navigate]);

  const loadCanvases = async () => {
    try {
      const { data, error } = await supabase
        .from('canvases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCanvases(data || []);
    } catch (error: any) {
      toast({
        title: "캔버스 로드 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCanvasesLoading(false);
    }
  };

  const handleCreateCanvas = async (formData: any) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('canvases')
        .insert({
          title: formData.title,
          image_url: formData.imageUrl || '/placeholder.svg',
          owner_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "캔버스 생성됨",
        description: "새 캔버스가 성공적으로 생성되었습니다.",
      });

      setCanvases([data, ...canvases]);
      setIsCreateModalOpen(false);
    } catch (error: any) {
      toast({
        title: "캔버스 생성 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const filteredCanvases = canvases.filter(canvas =>
    canvas.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || canvasesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                PinCanvas
              </h1>
              <p className="text-muted-foreground">이미지 위에 정보를 정리하고 관리하세요</p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {user?.email}
              </span>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="gradient-primary text-white border-0 hover:scale-105 transition-transform"
              >
                <Plus className="w-4 h-4 mr-2" />
                새 캔버스
              </Button>
              <Button 
                variant="outline"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="캔버스 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Grid className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              총 {filteredCanvases.length}개의 캔버스
            </p>
          </div>
        </div>

        {/* Canvas Grid */}
        <CanvasGrid 
          searchQuery={searchTerm} 
          sortBy={sortBy} 
          canvases={canvases}
          onCanvasesChange={setCanvases}
        />
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