import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { subscribeTeams } from '../../data/teams'
import { submitRegistration } from '../../data/representatives'
import { maskPhoneBR } from '../../lib/format'
import { Input, Select } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import type { Team } from '../../types'

const schema = z.object({
  teamId: z.string().min(1, 'Selecione o time.'),
  rep1Name: z.string().trim().min(3, 'Informe o nome completo.'),
  rep1Phone: z.string().min(14, 'Informe um telefone válido.'),
  rep2Name: z.string().trim().min(3, 'Informe o nome completo.'),
  rep2Phone: z.string().min(14, 'Informe um telefone válido.'),
})
type FormValues = z.infer<typeof schema>

export default function RepresentativeRegistration() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [done, setDone] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const unsub = subscribeTeams((list) => {
      setTeams(list)
      setLoadingTeams(false)
    })
    return unsub
  }, [])

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const availableTeams = teams.filter((t) => t.active && !t.representativesSubmitted)

  async function onSubmit(values: FormValues) {
    try {
      await submitRegistration(values)
      setDone(true)
    } catch {
      toast.error('Não foi possível enviar o cadastro. Verifique se o time já não foi registrado e tente novamente.')
    }
  }

  if (done) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-ink-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-ink-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-3xl text-brand-600">
            ✓
          </div>
          <h1 className="mt-4 text-xl font-bold text-ink-900">Cadastro realizado com sucesso.</h1>
          <p className="mt-2 text-sm text-ink-500">As informações serão validadas pela organização.</p>
          <Link to="/" className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:underline">
            Voltar ao início
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-ink-50 px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Campeonato 2026</p>
          <h1 className="mt-1 text-2xl font-extrabold text-ink-900 sm:text-3xl">CADASTRO DE REPRESENTANTES</h1>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 rounded-2xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8"
        >
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-400">Equipe</h2>
            <Select
              label="Selecione o seu time"
              disabled={loadingTeams}
              error={errors.teamId?.message}
              {...register('teamId')}
            >
              <option value="">{loadingTeams ? 'Carregando times...' : 'Selecione...'}</option>
              {availableTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
            {!loadingTeams && availableTeams.length === 0 && (
              <p className="mt-2 text-xs text-amber-600">
                Todos os times já enviaram seus representantes. Fale com a organização se isso for um engano.
              </p>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-400">Representante 1</h2>
            <Input label="Nome completo" placeholder="Nome completo" error={errors.rep1Name?.message} {...register('rep1Name')} />
            <Controller
              control={control}
              name="rep1Phone"
              render={({ field }) => (
                <Input
                  label="Telefone / WhatsApp"
                  placeholder="(00) 00000-0000"
                  inputMode="numeric"
                  error={errors.rep1Phone?.message}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(maskPhoneBR(e.target.value))}
                />
              )}
            />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-400">Representante 2</h2>
            <Input label="Nome completo" placeholder="Nome completo" error={errors.rep2Name?.message} {...register('rep2Name')} />
            <Controller
              control={control}
              name="rep2Phone"
              render={({ field }) => (
                <Input
                  label="Telefone / WhatsApp"
                  placeholder="(00) 00000-0000"
                  inputMode="numeric"
                  error={errors.rep2Phone?.message}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(maskPhoneBR(e.target.value))}
                />
              )}
            />
          </section>

          <Button type="submit" size="lg" className="w-full" loading={isSubmitting} disabled={availableTeams.length === 0}>
            ENVIAR CADASTRO
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-400">
          <Link to="/" className="hover:underline">
            ← Voltar ao início
          </Link>
        </p>
      </div>
    </div>
  )
}
