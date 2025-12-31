import { createContext, useContext, useState, ReactNode } from 'react';

interface CreateMovementContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CreateMovementContext = createContext<CreateMovementContextType | undefined>(undefined);

export function CreateMovementProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <CreateMovementContext.Provider value={{ open, setOpen }}>
      {children}
    </CreateMovementContext.Provider>
  );
}

export function useCreateMovement() {
  const context = useContext(CreateMovementContext);
  if (context === undefined) {
    throw new Error('useCreateMovement must be used within a CreateMovementProvider');
  }
  return context;
}

