import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DEFAULT_CONFIG, subscribeConfig } from '../../data/config'
import type { ChampionshipConfig, Standing } from '../../types'
import { resolveChampionshipLogo } from '../../lib/branding'
import { getTournament } from '../../data/matches'
import { SponsorMark } from '../../components/public/SponsorMark'

const ACCESS_CARDS = [
  {
    to: '/representantes',
    icon: '📋',
    title: 'CADASTRO DE REPRESENTANTES',
    desc: 'Envie os dados do seu time',
    ring: 'hover:border-brand-400/70 hover:bg-brand-500/10',
    dot: 'bg-brand-400',
  },
  {
    to: '/equipes/login',
    icon: '🛡️',
    title: 'ÁREA DAS EQUIPES',
    desc: 'Login do seu time',
    ring: 'hover:border-emerald-400/70 hover:bg-emerald-500/10',
    dot: 'bg-emerald-400',
  },
  {
    to: '/admin/login',
    icon: '⚙️',
    title: 'ORGANIZAÇÃO',
    desc: 'Painel administrativo',
    ring: 'hover:border-gold-400/70 hover:bg-gold-400/10',
    dot: 'bg-gold-400',
    featured: true,
  },
] as const

export default function Home() {
  const [config, setConfig] = useState<ChampionshipConfig>(DEFAULT_CONFIG)
  const [standings, setStandings] = useState<Standing[]>([])

  useEffect(() => subscribeConfig(setConfig), [])
  useEffect(() => {
    void getTournament()
      .then((data) => setStandings(data.standings))
      .catch(() => undefined)
  }, [])

  const leader = standings.find((team) => team.games > 0)

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-pitch-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_5%,rgba(13,101,218,.48),transparent_36%),linear-gradient(135deg,#020817_20%,#061c48_55%,#020817)]" />
      <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 py-12 text-center sm:py-16">
        <img
          src={resolveChampionshipLogo(config.logoUrl)}
          alt={`Logo ${config.name}`}
          className="championship-glow h-40 w-40 rounded-3xl object-cover sm:h-48 sm:w-48"
        />
        <span className="mt-7 rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-1.5 text-xs font-extrabold tracking-[.22em] text-gold-400">
          TEMPORADA {config.season}
        </span>
        <h1 className="championship-wordmark mt-4 text-4xl font-extrabold text-white sm:text-6xl">{config.name}</h1>
        <p className="mt-3 max-w-md text-sm text-blue-100 sm:text-base">10 equipes • mata-mata • organização profissional</p>

        <div className="mt-10 grid w-full gap-4 sm:grid-cols-3">
          {ACCESS_CARDS.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className={`group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-white/15 bg-white/[.06] px-6 py-8 shadow-xl backdrop-blur transition-all hover:-translate-y-1 ${card.ring}`}
            >
              <span className={`absolute left-0 top-0 h-1 w-full ${card.dot} opacity-70 transition-opacity group-hover:opacity-100`} />
              <span className="text-3xl">{card.icon}</span>
              <span className="text-sm font-black tracking-wide">{card.title}</span>
              <span className="text-xs text-ink-300">{card.desc}</span>
            </Link>
          ))}
        </div>

        <Link
          to="/painel"
          className="championship-glow group relative mt-6 flex w-full flex-col items-center gap-2 overflow-hidden rounded-2xl border border-gold-400/50 bg-gradient-to-r from-brand-700/60 via-pitch-800/60 to-emerald-800/40 px-6 py-7 text-center shadow-2xl backdrop-blur transition-all hover:-translate-y-1 hover:border-gold-400 sm:flex-row sm:justify-between sm:text-left"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold-400/15 text-3xl ring-1 ring-gold-400/40">
              🏆
            </span>
            <div>
              <p className="text-lg font-black tracking-wide text-gold-400 sm:text-xl">PAINEL DO CAMPEONATO</p>
              <p className="mt-0.5 text-xs text-blue-100 sm:text-sm">
                Classificação · Jogos · Artilharia · Histórico de partidas · Critérios de desempate
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {leader && (
              <span className="hidden rounded-xl bg-black/25 px-3 py-2 text-left text-xs sm:block">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-gold-400">1º lugar</span>
                <span className="font-bold">{leader.teamName}</span>
              </span>
            )}
            <span className="rounded-xl border border-white/25 px-4 py-2 text-xs font-black tracking-wide transition-colors group-hover:bg-white/10">
              ACESSAR →
            </span>
          </div>
        </Link>
      </div>

      <footer className="relative flex flex-col items-center gap-3 border-t border-white/10 px-6 py-5 text-center text-xs font-medium tracking-wide text-blue-200 sm:flex-row sm:justify-between">
        <span>COPA COHATRAC TF • TRANSFORMANDO O FUTURO</span>
        <SponsorMark />
      </footer>
    </div>
  )
}
