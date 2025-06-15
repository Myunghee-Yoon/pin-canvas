
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Eye, EyeOff, Edit, Trash2, Layers, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Canvas {
  id: string;
  title: string;
  imageUrl: string;
  createdAt: Date;
  pinCount: number;
  layerCount: number;
}

interface Layer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  canvasId: string;
}

interface PinData {
  id: string;
  x: number;
  y: number;
  title: string;
  description: string;
  layerId: string;
  canvasId: string;
}

const CanvasView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [pins, setPins] = useState<PinData[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string>('');

  useEffect(() => {
    // 임시 데이터 - 실제로는 API에서 가져와야 함
    const mockCanvas: Canvas = {
      id: id || '1',
      title: id === '1' ? '서울 여행 계획' : '프로젝트 기획서',
      imageUrl: '/placeholder.svg',
      createdAt: new Date(),
      pinCount: 3,
      layerCount: 2,
    };

    const mockLayers: Layer[] = [
      {
        id: 'layer1',
        name: '맛집',
        color: '#ef4444',
        visible: true,
        canvasId: id || '1',
      },
      {
        id: 'layer2',
        name: '관광지',
        color: '#3b82f6',
        visible: true,
        canvasId: id || '1',
      },
    ];

    const mockPins: PinData[] = [
      {
        id: 'pin1',
        x: 200,
        y: 150,
        title: '경복궁',
        description: '조선 시대의 대표적인 궁궐',
        layerId: 'layer2',
        canvasId: id || '1',
      },
      {
        id: 'pin2',
        x: 350,
        y: 220,
        title: '명동 교자',
        description: '유명한 만두 맛집',
        layerId: 'layer1',
        canvasId: id || '1',
      },
    ];

    setCanvas(mockCanvas);
    setLayers(mockLayers);
    setPins(mockPins);
    setSelectedLayerId(mockLayers[0]?.id || '');
  }, [id]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedLayerId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPin: PinData = {
      id: `pin${Date.now()}`,
      x,
      y,
      title: '새 핀',
      description: '핀 설명을 입력하세요',
      layerId: selectedLayerId,
      canvasId: id || '1',
    };

    setPins([...pins, newPin]);
  };

  const toggleLayerVisibility = (layerId: string) => {
    setLayers(layers.map(layer => 
      layer.id === layerId 
        ? { ...layer, visible: !layer.visible }
        : layer
    ));
  };

  const getVisiblePins = () => {
    const visibleLayerIds = layers.filter(layer => layer.visible).map(layer => layer.id);
    return pins.filter(pin => visibleLayerIds.includes(pin.layerId));
  };

  const getLayerColor = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    return layer?.color || '#6b7280';
  };

  if (!canvas) {
    return <div>캔버스를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{canvas.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {pins.length}개의 핀 • {layers.length}개의 레이어
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                선택된 레이어: {layers.find(l => l.id === selectedLayerId)?.name || '없음'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Layer Panel */}
        <div className="w-80 bg-white/60 backdrop-blur-sm border-r border-border/50 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Layers className="w-5 h-5 mr-2" />
              레이어 관리
            </h2>
            
            <div className="space-y-3">
              {layers.map((layer) => (
                <Card
                  key={layer.id}
                  className={`cursor-pointer transition-all ${
                    selectedLayerId === layer.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50/50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedLayerId(layer.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full border-2"
                          style={{ backgroundColor: layer.color }}
                        />
                        <span className="font-medium">{layer.name}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLayerVisibility(layer.id);
                          }}
                        >
                          {layer.visible ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-muted-foreground">
                      {pins.filter(pin => pin.layerId === layer.id).length}개의 핀
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="text-sm text-muted-foreground bg-blue-50 p-4 rounded-lg">
            <p className="font-medium mb-2">사용법:</p>
            <ul className="space-y-1 text-xs">
              <li>• 레이어를 선택한 후 캔버스를 클릭하여 핀 추가</li>
              <li>• 눈 아이콘으로 레이어 표시/숨김</li>
              <li>• 핀을 클릭하여 정보 확인</li>
            </ul>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 p-6">
          <div
            className="relative bg-white rounded-lg shadow-lg overflow-hidden cursor-crosshair"
            style={{ minHeight: '600px' }}
            onClick={handleCanvasClick}
          >
            <img
              src={canvas.imageUrl}
              alt={canvas.title}
              className="w-full h-full object-contain"
              style={{ minHeight: '600px' }}
            />
            
            {/* Pins */}
            {getVisiblePins().map((pin) => (
              <div
                key={pin.id}
                className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform flex items-center justify-center"
                style={{
                  left: pin.x - 12,
                  top: pin.y - 12,
                  backgroundColor: getLayerColor(pin.layerId),
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  alert(`${pin.title}\n${pin.description}`);
                }}
              >
                <Pin className="w-3 h-3 text-white" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasView;
