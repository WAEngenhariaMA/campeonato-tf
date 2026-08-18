const VARS = [
  'VITE_API_URL',
]

/** Shown instead of a blank page when the API URL is missing — see SETUP.md. */
export default function ConfigMissing() {
  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f14', color: '#e6eaf2', fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>⚙️</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 12 }}>Configuração da API pendente</h1>
        <p style={{ marginTop: 12, color: '#8493ac', lineHeight: 1.6 }}>
          O site foi publicado, mas ainda não tem a URL da API PostgreSQL configurada — por isso as telas de
          login e cadastro não funcionam ainda.
        </p>
        <p style={{ marginTop: 12, color: '#8493ac', lineHeight: 1.6 }}>
          Siga o <strong>SETUP.md</strong> do repositório: crie o banco Neon, publique a API e cadastre a variável
          abaixo no ambiente do frontend.
        </p>
        <ul style={{ marginTop: 16, textAlign: 'left', fontSize: 13, color: '#c2cadb', background: '#171e28', borderRadius: 12, padding: '16px 20px', listStyle: 'none' }}>
          {VARS.map((v) => (
            <li key={v} style={{ padding: '4px 0', fontFamily: 'ui-monospace, monospace' }}>
              {v}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
