import { BarChart3, Trophy, AlertTriangle } from 'lucide-react'

const GENERAL_RULES = [
  'Maior saldo de gols',
  'Maior número de gols marcados (pró)',
  'Menor número de gols sofridos (contra)',
  'Menor número de cartões vermelhos',
  'Menor número de cartões amarelos',
  'Sorteio administrativo em caso de igualdade absoluta',
]

const KNOCKOUT_RULES = [
  'Vitória no tempo normal tem vantagem sobre vitória nos pênaltis',
  'Derrota somente nos pênaltis tem vantagem sobre derrota no tempo normal (melhor perdedor)',
  'Maior saldo de gols no tempo normal',
  'Maior número de gols marcados',
  'Menor número de gols sofridos',
  'Menor número de cartões vermelhos e amarelos',
  'Sorteio da organização em igualdade absoluta',
]

function RuleList({ rules, dotClass }: { rules: string[]; dotClass: string }) {
  return (
    <ol className="mt-4 space-y-2.5 text-sm">
      {rules.map((rule, i) => (
        <li key={rule} className="flex gap-3">
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${dotClass}`}>{i + 1}</span>
          <span>{rule}</span>
        </li>
      ))}
    </ol>
  )
}

export function CriteriaCard() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-black"><BarChart3 size={18} className="text-brand-600" /> CLASSIFICAÇÃO GERAL</h2>
        <p className="mt-1 text-sm text-ink-500">Ordem de critérios usada para desempatar times na tabela.</p>
        <RuleList rules={GENERAL_RULES} dotClass="bg-brand-100 text-brand-700" />
      </div>
      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-black"><Trophy size={18} className="text-gold-500" /> REGRAS DO MATA-MATA</h2>
        <p className="mt-1 text-sm text-ink-500">Como vencedores e o melhor perdedor da primeira fase são ranqueados.</p>
        <RuleList rules={KNOCKOUT_RULES} dotClass="bg-gold-400/20 text-gold-600" />
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          Gols marcados na disputa de pênaltis não entram no saldo de gols nem nas estatísticas da classificação.
        </p>
      </div>
    </div>
  )
}
