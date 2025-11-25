import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Home() {
  const [role, setRole] = useState('');
  const [verified, setVerified] = useState(false);
  const [workspace, setWorkspace] = useState(null);

  const handleKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    // Symulacja selfie upload + weryfikacja (w realu: Onfido API)
    if (role === 'ethical hacker') {
      const { data } = await supabase.auth.signUp({ email: 'user@example.com', password: 'pass' });
      if (data.user) {
        setVerified(true);
        // Unlock workspace
        fetch('/api/unlock', { method: 'POST', body: JSON.stringify({ role }) });
      }
    }
  };

  const runScan = async (scope: string) => {
    const res = await fetch('/api/scan', {
      method: 'POST',
      body: JSON.stringify({ scope, model: 'grok-4.1' })  // Grok API call
    });
    const report = await res.json();
    setWorkspace(report);  // Wyświetl raport z POC, remediation
  };

  if (!verified) {
    return (
      <form onSubmit={handleKYC}>
        <input type="text" placeholder="Deklaruj rolę (np. ethical hacker)" onChange={(e) => setRole(e.target.value)} />
        <button type="submit">Weryfikuj selfie + odblokuj</button>
      </form>
    );
  }

  return (
    <div>
      <h1>RedKey Workspace: {role}</h1>
      <input type="text" placeholder="Wrzuć scope (np. perplexity.ai)" onBlur={(e) => runScan(e.target.value)} />
      {workspace && <pre>{JSON.stringify(workspace, null, 2)}</pre>}  {/* Raport z CAI + AI-Vuln */}
      {/* Docker Kali tools: Button do exec ffuf/Nuclei via MCP */}
      <button onClick={() => fetch('/api/exec-tool', { body: JSON.stringify({ tool: 'ffuf' }) })}>Uruchom ffuf</button>
    </div>
  );
}
