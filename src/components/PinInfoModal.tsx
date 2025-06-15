
import React, { useState, useEffect } from 'react';
import { X, Edit, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageVideoUpload } from './ImageVideoUpload';

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'url';
  url: string;
  name?: string;
}

interface PinData {
  id: string;
  x: number;
  y: number;
  title: string;
  description: string;
  layerId: string;
  canvasId: string;
  mediaItems?: MediaItem[];
}

interface PinInfoModalProps {
  pin: PinData | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (pin: PinData) => void;
  onDelete: (pinId: string) => void;
  layerColor: string;
  isNewPin?: boolean;
}

export const PinInfoModal: React.FC<PinInfoModalProps> = ({
  pin,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  layerColor,
  isNewPin = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    mediaItems: [] as MediaItem[]
  });

  useEffect(() => {
    if (isNewPin && pin) {
      // 새 핀인 경우 바로 편집 모드로 시작
      setIsEditing(true);
      setEditData({
        title: pin.title,
        description: pin.description,
        mediaItems: pin.mediaItems || []
      });
    } else if (pin && !isNewPin) {
      // 기존 핀인 경우 편집 모드 해제
      setIsEditing(false);
    }
  }, [pin, isNewPin]);

  if (!isOpen || !pin) return null;

  const handleEdit = () => {
    setEditData({
      title: pin.title,
      description: pin.description,
      mediaItems: pin.mediaItems || []
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdate({
      ...pin,
      title: editData.title,
      description: editData.description,
      mediaItems: editData.mediaItems
    });
    setIsEditing(false);
    if (isNewPin) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (isNewPin) {
      // 새 핀 생성을 취소하는 경우 모달 닫기
      onClose();
    } else {
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (confirm('이 핀을 삭제하시겠습니까?')) {
      onDelete(pin.id);
      onClose();
    }
  };

  const renderMediaItem = (item: MediaItem) => {
    switch (item.type) {
      case 'image':
        return (
          <img
            src={item.url}
            alt={item.name}
            className="w-full max-h-48 object-contain rounded-lg"
          />
        );
      case 'video':
        return (
          <video
            src={item.url}
            controls
            className="w-full max-h-48 rounded-lg"
          />
        );
      case 'url':
        return (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 underline break-all"
          >
            {item.name || item.url}
          </a>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: layerColor }}
            />
            <h2 className="text-lg font-semibold">
              {isNewPin ? '새 핀 추가' : '핀 정보'}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="pin-title">제목</Label>
                <Input
                  id="pin-title"
                  value={editData.title}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="핀 제목을 입력하세요"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pin-description">설명</Label>
                <Textarea
                  id="pin-description"
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="핀 설명을 입력하세요"
                  rows={4}
                />
              </div>

              <ImageVideoUpload
                mediaItems={editData.mediaItems}
                onMediaChange={(mediaItems) => setEditData(prev => ({ ...prev, mediaItems }))}
              />

              <div className="flex space-x-2 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {isNewPin ? '추가' : '저장'}
                </Button>
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  <X className="w-4 h-4 mr-2" />
                  취소
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="font-semibold text-lg mb-2">{pin.title}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap mb-4">{pin.description}</p>
                
                {/* Media Display */}
                {pin.mediaItems && pin.mediaItems.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-700">첨부된 미디어</h4>
                    <div className="space-y-3">
                      {pin.mediaItems.map((item) => (
                        <div key={item.id} className="border rounded-lg p-2">
                          {renderMediaItem(item)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-4">
                <Button onClick={handleEdit} variant="outline" className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  수정
                </Button>
                <Button onClick={handleDelete} variant="destructive" className="flex-1">
                  <Trash2 className="w-4 h-4 mr-2" />
                  삭제
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
