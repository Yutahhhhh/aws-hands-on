import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, NewUser, UpdateUser } from '@/types/user';
import { createUser, updateUser, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const userSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(100, '名前は100文字以内で入力してください'),
  email: z.string().email('正しいメールアドレスを入力してください'),
  age: z.coerce.number().min(0, '年齢は0以上で入力してください').max(150, '年齢は150以下で入力してください').optional().or(z.literal('')),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: User | null;
}

export default function UserForm({ isOpen, onClose, onSuccess, user }: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!user;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      age: user?.age || '',
    },
  });

  const onSubmit = async (data: UserFormData) => {
    try {
      setLoading(true);
      setError(null);

      const userData = {
        name: data.name,
        email: data.email,
        age: data.age === '' ? null : Number(data.age),
      };

      if (isEditing && user) {
        await updateUser(user.id, userData as UpdateUser);
      } else {
        await createUser(userData as NewUser);
      }

      reset();
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'ユーザーの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  // ダイアログが開いた時にフォームをリセット
  React.useEffect(() => {
    if (isOpen) {
      reset({
        name: user?.name || '',
        email: user?.email || '',
        age: user?.age || '',
      });
      setError(null);
    }
  }, [isOpen, user, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'ユーザー編集' : '新規ユーザー作成'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'ユーザー情報を編集してください'
              : '新しいユーザーの情報を入力してください'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">名前 *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="田中太郎"
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス *</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="tanaka@example.com"
              disabled={loading}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">年齢</Label>
            <Input
              id="age"
              type="number"
              {...register('age')}
              placeholder="25"
              disabled={loading}
              min="0"
              max="150"
            />
            {errors.age && (
              <p className="text-sm text-red-600">{errors.age.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : isEditing ? '更新' : '作成'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}