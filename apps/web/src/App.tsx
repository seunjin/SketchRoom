import { Outlet } from '@tanstack/react-router';
import { DialogRuntime } from '@woon-ui/dialog';
import { Toaster } from '@woon-ui/toast';
import { Toast } from './woon/ui/toast';

function App() {
  return (
    <>
      <Outlet />
      <DialogRuntime zIndex={100} />
      <Toaster maxVisible={3} position="bottom-right" render={Toast} />
    </>
  );
}

export default App;
