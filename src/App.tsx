import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { CreateMovementProvider } from './contexts/CreateMovementContext';
import { CreateMovementDrawer } from './components/debt/CreateMovementDrawer';
import { InstallPrompt } from './components/pwa/InstallPrompt';
import { useCreateMovement } from './contexts/CreateMovementContext';

function AppContent() {
  const { open, setOpen } = useCreateMovement();
  
  return (
    <>
      <AppRoutes />
      <CreateMovementDrawer open={open} onOpenChange={setOpen} />
      <InstallPrompt />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <CreateMovementProvider>
        <AppContent />
      </CreateMovementProvider>
    </BrowserRouter>
  );
}

export default App;

