import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'

export default function TeamMatches() {
  return (
    <div>
      <PageHeader title="CONFRONTOS" subtitle="Jogos do seu time." />
      <Card className="p-8 text-center">
        <p className="text-sm text-ink-400">
          Os confrontos aparecerão aqui assim que o sorteio oficial for realizado e a organização confirmar o calendário.
        </p>
      </Card>
    </div>
  )
}
