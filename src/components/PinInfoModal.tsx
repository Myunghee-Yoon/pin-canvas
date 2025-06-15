
import React, { useState } from 'react';
import { X, Edit, Trash2, Save, Cancel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PinData {
  id: string;
  x: number;
  y: number;
  title: string;
  description: string;
  layerId: string;
  canvasId: string;
}

interface PinInfoModalProps {
  pin: PinData | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (pin: PinData) => void;
  onDelete: (pinId: string) => void;
  layerColor: string;
}

export const PinInfoModal: React.FC<PinInfoModalProps> = ({
  pin,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  layerColor
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: ''
  });

  if (!isOpen || !pin) return null;

  const handleEdit = () => {
    setEditData({
      title: pin.title,
      description: pin.description
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdate({
      ...pin,
      title: editData.title,
      description: editData.description
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('이 핀을 삭제하시겠습니까?')) {
      onDelete(pin.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: layerColor }}
            />
            <h2 className="text-lg font-semibold">핀 정보</h2>
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

        <div className="p-6 space-y-4">
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

              <div className="flex space-x-2 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  저장
                </Button>
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  <Cancel className="w-4 h-4 mr-2" />
                  취소
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="font-semibold text-lg mb-2">{pin.title}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{pin.description}</p>
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
