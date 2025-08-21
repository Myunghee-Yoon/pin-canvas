import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Copy, Mail, Users, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasId: string;
  canvasTitle: string;
}

interface ShareWithProfile {
  id: string;
  user_id: string;
  permission: 'editor' | 'viewer';
  display_name: string;
  email: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, canvasId, canvasTitle }) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'editor' | 'viewer'>('viewer');
  const [shares, setShares] = useState<ShareWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const shareUrl = `${window.location.origin}/canvas/${canvasId}`;

  useEffect(() => {
    if (isOpen) {
      loadShares();
    }
  }, [isOpen, canvasId]);

  const loadShares = async () => {
    try {
      // First get the shares
      const { data: sharesData, error: sharesError } = await supabase
        .from('canvas_shares')
        .select('id, user_id, permission')
        .eq('canvas_id', canvasId);

      if (sharesError) throw sharesError;

      if (!sharesData || sharesData.length === 0) {
        setShares([]);
        return;
      }

      // Then get the profiles for those users
      const userIds = sharesData.map(share => share.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const sharesWithProfiles = sharesData.map(share => {
        const profile = profilesData?.find(p => p.user_id === share.user_id);
        return {
          id: share.id,
          user_id: share.user_id,
          permission: share.permission as 'editor' | 'viewer',
          display_name: profile?.display_name || 'Unknown',
          email: profile?.email || 'Unknown'
        };
      });

      setShares(sharesWithProfiles);
    } catch (error: any) {
      toast({
        title: "공유 목록 로드 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!email.trim()) return;

    setLoading(true);
    try {
      // Find user by email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email.trim())
        .single();

      if (profileError || !profiles) {
        toast({
          title: "사용자를 찾을 수 없습니다",
          description: "해당 이메일로 가입된 사용자가 없습니다.",
          variant: "destructive",
        });
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "인증 오류",
          description: "로그인이 필요합니다.",
          variant: "destructive",
        });
        return;
      }

      // Create share
      const { error: shareError } = await supabase
        .from('canvas_shares')
        .insert({
          canvas_id: canvasId,
          user_id: profiles.user_id,
          permission,
          shared_by: user.id
        });

      if (shareError) {
        if (shareError.code === '23505') {
          toast({
            title: "이미 공유됨",
            description: "해당 사용자와 이미 공유되어 있습니다.",
            variant: "destructive",
          });
        } else {
          throw shareError;
        }
        return;
      }

      toast({
        title: "공유 완료",
        description: `${email}과 캔버스를 공유했습니다.`,
      });

      setEmail('');
      loadShares();
    } catch (error: any) {
      toast({
        title: "공유 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from('canvas_shares')
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      toast({
        title: "공유 제거됨",
        description: "공유 권한이 제거되었습니다.",
      });

      loadShares();
    } catch (error: any) {
      toast({
        title: "제거 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdatePermission = async (shareId: string, newPermission: 'editor' | 'viewer') => {
    try {
      const { error } = await supabase
        .from('canvas_shares')
        .update({ permission: newPermission })
        .eq('id', shareId);

      if (error) throw error;

      toast({
        title: "권한 변경됨",
        description: "공유 권한이 변경되었습니다.",
      });

      loadShares();
    } catch (error: any) {
      toast({
        title: "변경 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "복사됨",
        description: "클립보드에 복사되었습니다.",
      });
    } catch (error) {
      toast({
        title: "복사 실패",
        description: "클립보드 복사에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            "{canvasTitle}" 공유
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share Link */}
          <div className="space-y-2">
            <Label>공유 링크</Label>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(shareUrl)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Add New Share */}
          <div className="space-y-2">
            <Label>사용자 초대</Label>
            <div className="flex gap-2">
              <Input
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Select value={permission} onValueChange={(value: 'editor' | 'viewer') => setPermission(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">뷰어</SelectItem>
                  <SelectItem value="editor">편집자</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleShare} disabled={loading || !email.trim()}>
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Current Shares */}
          {shares.length > 0 && (
            <div className="space-y-2">
              <Label>공유된 사용자</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {shares.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1">
                      <div className="font-medium">{share.display_name}</div>
                      <div className="text-sm text-muted-foreground">{share.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={share.permission}
                        onValueChange={(value: 'editor' | 'viewer') => handleUpdatePermission(share.id, value)}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">뷰어</SelectItem>
                          <SelectItem value="editor">편집자</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveShare(share.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary">뷰어</Badge>
              <span>캔버스를 보고 댓글을 남길 수 있습니다</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">편집자</Badge>
              <span>핀과 레이어를 추가/편집/삭제할 수 있습니다</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;