import { Trophy, AlertTriangle } from 'lucide-react'

// Um único critério para toda a competição — não existe fase de grupos aqui, é tudo mata-mata,
// então a classificação geral e o ranking do mata-mata usam exatamente a mesma régua.
const CRITERIA = [
  'Resultado no tempo normal (vitória no tempo normal tem vantagem sobre vitória nos pênaltis)',
  'Maior saldo de gols no tempo normal',
  'Maior número de gols marcados no tempo normal',
  'Menor número de gols sofridos',
  'Menor número de cartões vermelhos',
  'Menor número de cartões amarelos',
  'Menor número de faltas',
  'Sorteio realizado pela organização',
]

export function CriteriaCard() {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-black"><Trophy size={18} className="text-gold-500" /> CRITÉRIOS DE CLASSIFICAÇÃO</h2>
      <p className="mt-1 text-sm text-ink-500">
        Toda a competição é eliminatória — a mesma ordem de critérios vale para a classificação geral e para o
        ranking de vencedores e do melhor perdedor da primeira fase.
      </p>
      <ol className="mt-4 space-y-2.5 text-sm">
        {CRITERIA.map((rule, i) => (
          <li key={rule} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-400/20 text-xs font-black text-gold-600">{i + 1}º</span>
            <span>{rule}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
        Gols marcados na disputa de pênaltis não entram no saldo de gols nem nas estatísticas da classificação —
        só decidem quem avança.
      </p>
    </div>
  )
}
