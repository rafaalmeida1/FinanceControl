import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, FileText, Image, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { filesService } from '@/services/files.service';
import toast from 'react-hot-toast';

interface ProofUploadProps {
  onUploadComplete?: (path: string, mimeType: string) => void;
  onRemove?: () => void;
  initialPath?: string;
  initialMimeType?: string;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

export function ProofUpload({
  onUploadComplete,
  onRemove,
  initialPath,
  initialMimeType,
  disabled = false,
}: ProofUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(initialPath || null);
  const [uploadedMimeType, setUploadedMimeType] = useState<string | null>(initialMimeType || null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use PDF, PNG ou JPG.');
      return;
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }

    // Criar preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    // Upload
    setIsUploading(true);
    try {
      const result = await filesService.uploadProof(file);
      setUploadedPath(result.path);
      setUploadedMimeType(result.mimeType);
      onUploadComplete?.(result.path, result.mimeType);
      toast.success('Comprovante enviado com sucesso!');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao enviar comprovante');
      setPreview(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setUploadedPath(null);
    setUploadedMimeType(null);
    setPreview(null);
    onRemove?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleView = async () => {
    if (!uploadedPath) return;
    try {
      const blob = await filesService.getProof(uploadedPath);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      toast.error('Erro ao visualizar comprovante');
    }
  };

  const isPdf = uploadedMimeType === 'application/pdf';
  const isImage = uploadedMimeType?.startsWith('image/');

  return (
    <div className="space-y-4">
      <Label>Comprovante de Pagamento (Opcional)</Label>
      <p className="text-sm text-muted-foreground">
        Envie uma foto ou PDF do comprovante. Isso ajuda a manter os registros organizados.
      </p>

      {!uploadedPath ? (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
            disabled
              ? 'border-muted bg-muted/50 cursor-not-allowed'
              : 'border-border hover:border-primary cursor-pointer'
          )}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Enviando...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                Clique para selecionar ou arraste o arquivo aqui
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, PNG ou JPG (máx. 10MB)
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              {isPdf ? (
                <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              ) : isImage ? (
                preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Image className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                )
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <p className="text-sm font-medium truncate">Comprovante enviado</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {isPdf ? 'PDF' : isImage ? 'Imagem' : 'Arquivo'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleView}
                disabled={disabled}
              >
                Ver
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {uploadedPath && (
        <Alert>
          <AlertDescription className="text-xs">
            O comprovante será enviado ao credor por email após a confirmação do pagamento.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

