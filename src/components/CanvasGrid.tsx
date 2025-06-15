
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Pin, Layers, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Canvas {
  id: string;
  title: string;
  imageUrl: string;
  createdAt: Date;
  pinCount: number;
  layerCount: number;
}

interface CanvasGridProps {
  canvases: Canvas[];
}

export const CanvasGrid: React.FC<CanvasGridProps> = ({ canvases }) => {
  const navigate = useNavigate();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const handleCanvasClick = (canvasId: string) => {
    navigate(`/canvas/${canvasId}`);
  };

  if (canvases.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4">
          <Pin className="w-12 h-12 text-blue-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">아직 캔버스가 없습니다</h3>
        <p className="text-muted-foreground mb-4">
          첫 번째 캔버스를 만들어 정보를 정리해보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {canvases.map((canvas) => (
        <Card
          key={canvas.id}
          className="group bg-white/60 backdrop-blur-sm border-0 canvas-shadow hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
          onClick={() => handleCanvasClick(canvas.id)}
        >
          <div className="aspect-video bg-gradient-to-br from-blue-100 to-orange-100 relative overflow-hidden">
            <img
              src={canvas.imageUrl}
              alt={canvas.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
            
            {/* Action Button */}
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                // 더보기 메뉴 로직 추가 예정
              }}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
          
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-2 line-clamp-1">
              {canvas.title}
            </h3>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(canvas.createdAt)}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Badge variant="secondary" className="text-xs">
                  <Pin className="w-3 h-3 mr-1" />
                  {canvas.pinCount}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Layers className="w-3 h-3 mr-1" />
                  {canvas.layerCount}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
