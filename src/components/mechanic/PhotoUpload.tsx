
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Upload, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface PhotoUploadProps {
  workOrderId: string;
  onSuccess?: () => void;
}

const PhotoUpload = ({ workOrderId, onSuccess }: PhotoUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setFile(null);
      setPreview(null);
      return;
    }

    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    // Create a preview
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);

    // Free memory when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Необходима авторизация",
        description: "Пожалуйста, войдите в систему для загрузки фото",
        variant: "destructive",
      });
      return;
    }

    if (!file) {
      toast({
        title: "Выберите файл",
        description: "Пожалуйста, выберите фото для загрузки",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${workOrderId}/${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `repair_photos/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('repair_photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: publicURLData } = supabase.storage
        .from('repair_photos')
        .getPublicUrl(filePath);

      // Add record to repair_photos table
      const { error: dbError } = await supabase
        .from('repair_photos')
        .insert({
          work_order_id: workOrderId,
          created_by: user.id,
          photo_url: publicURLData.publicUrl,
          description: description.trim() || null
        });

      if (dbError) throw dbError;

      toast({
        title: "Фото успешно загружено",
        description: "Фотография добавлена к заказ-наряду",
      });

      // Reset form
      setFile(null);
      setPreview(null);
      setDescription("");
      
      // Execute success callback if provided
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Ошибка при загрузке фото",
        description: "Пожалуйста, попробуйте еще раз позже",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
        {preview ? (
          <div className="relative">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-h-64 mx-auto object-contain rounded" 
            />
            <button 
              type="button"
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div 
            className="py-8 flex flex-col items-center cursor-pointer"
            onClick={() => document.getElementById('photo-upload')?.click()}
          >
            <Camera className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-sm text-muted-foreground">
              Нажмите для выбора фото или перетащите файл сюда
            </p>
          </div>
        )}
        <Input
          id="photo-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div>
        <Textarea
          placeholder="Описание фото (необязательно)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={uploading || !file}
      >
        {uploading ? (
          <span className="flex items-center">
            <span className="animate-spin mr-2">⟳</span> Загрузка...
          </span>
        ) : (
          <span className="flex items-center">
            <Upload className="h-4 w-4 mr-2" /> Загрузить фото
          </span>
        )}
      </Button>
    </form>
  );
};

export default PhotoUpload;
