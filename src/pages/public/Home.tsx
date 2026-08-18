import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DEFAULT_CONFIG, subscribeConfig } from '../../data/config'
import type { ChampionshipConfig } from '../../types'

export default function Home() {
  const [config, setConfig] = useState<ChampionshipConfig>(DEFAULT_CONFIG)

  useEffect(() => subscribeConfig(setConfig), [])

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-pitch-900 via-pitch-950 to-ink-950 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <span className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold tracking-widest text-brand-400">
          TEMPORADA {config.season}
        </span>
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">{config.name}</h1>
        <p className="mt-3 max-w-md text-ink-300">10 equipes • mata-mata • organização profissional</p>

        <div className="mt-12 grid w-full gap-4 sm:grid-cols-3">
          <Link
            to="/representantes"
            className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-8 transition-colors hover:bg-white/10"
          >
            <span className="text-3xl">📋</span>
            <span className="text-sm font-bold">CADASTRO DE REPRESENTANTES</span>
            <span className="text-xs text-ink-400">Envie os dados do seu time</span>
          </Link>
          <Link
            to="/equipes/login"
            className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-8 transition-colors hover:bg-white/10"
          >
            <span className="text-3xl">🛡️</span>
            <span className="text-sm font-bold">ÁREA DAS EQUIPES</span>
            <span className="text-xs text-ink-400">Login do seu time</span>
          </Link>
          <Link
            to="/admin/login"
            className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-8 transition-colors hover:bg-white/10"
          >
            <span className="text-3xl">⚙️</span>
            <span className="text-sm font-bold">ORGANIZAÇÃO</span>
            <span className="text-xs text-ink-400">Painel administrativo</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
