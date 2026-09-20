import PersonTable from './components/PersonTable';
import TrendPanel from './components/TrendPanel';

export default function App() {
  // load People, wire up deletion and paging, and lay the page out
  return (
    <main>
      <h1>People</h1>
      <TrendPanel />
      <PersonTable people={[]} onDelete={() => {}} />
    </main>
  );
}
