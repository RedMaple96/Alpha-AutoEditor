import { Sidebar } from '@/components/layout/sidebar';
import { MainStage } from '@/components/layout/main-stage';
import { ControlPanel } from '@/components/layout/control-panel';

function App() {
  return (
    <div className="grid h-screen w-full bg-black text-zinc-100 overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200" style={{ gridTemplateColumns: '16rem 1fr 18rem' }}>
      <Sidebar />
      <MainStage />
      <ControlPanel />
    </div>
  );
}

export default App;
