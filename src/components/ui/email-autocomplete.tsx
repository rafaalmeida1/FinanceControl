import React, { useState, useEffect, useRef } from 'react';
import { Input } from './input';
import { Label } from './label';
import { cn } from '@/lib/utils';
import { debtsService } from '@/services/debts.service';
import { useQuery } from '@tanstack/react-query';

interface EmailAutocompleteProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
}

const COMMON_DOMAINS = ['@gmail.com', '@hotmail.com', '@outlook.com', '@yahoo.com', '@icloud.com'];

export function EmailAutocomplete({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder = 'exemplo@email.com',
  required = false,
}: EmailAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSelectingRef = useRef(false);

  // Buscar emails relacionados (tenta suggested-contacts primeiro, depois related-emails)
  const { data: relatedEmails = [] } = useQuery({
    queryKey: ['suggested-contacts'],
    queryFn: () => debtsService.getSuggestedContacts().catch(() => debtsService.getRelatedEmails()),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Gerar sugestões baseadas no input
  const getSuggestions = () => {
    const suggestions: Array<{ email: string; name?: string; type: 'related' | 'domain' }> = [];
    const lowerInput = inputValue.toLowerCase().trim();

    if (!lowerInput) {
      // Se não há input, mostrar apenas emails relacionados (limitado a 5)
      return relatedEmails.slice(0, 5).map((item) => ({
        email: item.email,
        name: item.name,
        type: 'related' as const,
      }));
    }

    // Verificar se já tem @
    const hasAt = lowerInput.includes('@');
    const [localPart, domainPart] = hasAt ? lowerInput.split('@') : [lowerInput, ''];

    // Sugestões de emails relacionados
    relatedEmails.forEach((item) => {
      const itemEmail = item.email.toLowerCase();
      if (itemEmail.includes(lowerInput)) {
        suggestions.push({
          email: item.email,
          name: item.name,
          type: 'related',
        });
      }
    });

    // Sugestões de domínios comuns
    if (hasAt && domainPart) {
      COMMON_DOMAINS.forEach((domain) => {
        if (domain.toLowerCase().includes(domainPart)) {
          suggestions.push({
            email: `${localPart}${domain}`,
            type: 'domain',
          });
        }
      });
    } else if (!hasAt) {
      // Se não tem @, sugerir domínios comuns
      COMMON_DOMAINS.forEach((domain) => {
        suggestions.push({
          email: `${lowerInput}${domain}`,
          type: 'domain',
        });
      });
    }

    // Remover duplicatas
    const uniqueSuggestions = suggestions.filter(
      (suggestion, index, self) =>
        index === self.findIndex((s) => s.email.toLowerCase() === suggestion.email.toLowerCase()),
    );

    return uniqueSuggestions.slice(0, 8); // Limitar a 8 sugestões
  };

  const suggestions = getSuggestions();
  const hasSuggestions = suggestions.length > 0 && showSuggestions;

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sincronizar inputValue com value prop (apenas se não estiver selecionando)
  useEffect(() => {
    if (!isSelectingRef.current) {
    setInputValue(value);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setShowSuggestions(true);
    setSelectedIndex(-1);
    isSelectingRef.current = false; // Resetar flag quando o usuário digita
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (suggestionEmail: string) => {
    isSelectingRef.current = true;
    setInputValue(suggestionEmail);
    onChange(suggestionEmail);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    // Resetar flag após um pequeno delay para permitir que o onChange complete
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!hasSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIndex].email);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        ref={inputRef}
        id={id}
        type="email"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={() => {
          // Delay para permitir clique na sugestão
          setTimeout(() => {
            if (!containerRef.current?.contains(document.activeElement)) {
            setShowSuggestions(false);
            onBlur?.();
            }
          }, 200);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(error && 'border-destructive')}
        autoComplete="off"
      />
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
      {hasSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.email}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectSuggestion(suggestion.email);
              }}
              className={cn(
                'w-full text-left px-4 py-2 hover:bg-accent focus:bg-accent focus:outline-none transition-colors',
                index === selectedIndex && 'bg-accent',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{suggestion.email}</span>
                {suggestion.name && (
                  <span className="text-sm text-muted-foreground ml-2">{suggestion.name}</span>
                )}
              </div>
              {suggestion.type === 'related' && (
                <span className="text-xs text-muted-foreground">Email relacionado</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

