import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Funções de formatação de valores
export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

// Funções de formatação de datas
export function formatDate(date: Date | string): string {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR').format(dateObj);
}

export function formatDateShort(date: Date | string): string {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy');
}

export function formatDateTime(date: Date | string): string {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(dateObj);
}

// Funções de status
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'badge-warning',
    PAID: 'badge-success',
    OVERDUE: 'badge-danger',
    CANCELLED: 'badge-info',
    ACTIVE: 'badge-success',
    INACTIVE: 'badge-danger',
    COMPLETED: 'badge-success',
    FAILED: 'badge-danger',
  };
  return colors[status] || 'badge';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pendente',
    PAID: 'Pago',
    OVERDUE: 'Atrasado',
    CANCELLED: 'Cancelado',
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    COMPLETED: 'Concluído',
    FAILED: 'Falhou',
  };
  return labels[status] || status;
}
