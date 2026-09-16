import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { resolveChampionshipLogo } from '../lib/branding'
import { resolveTeamShield } from '../lib/teamAssets'
import { formatDate } from '../lib/format'
import type { ChampionshipConfig, Coach, Match, Player, RepresentativeRegistration, Team } from '../types'

// @react-pdf/renderer busca imagens por URL absoluta — os helpers de escudo/logo devolvem
// caminhos relativos ao BASE_URL do Vite, então aqui é preciso completar com a origem atual.
function absoluteUrl(path: string | null): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  return `${window.location.origin}${path}`
}

const PHASE_LABEL: Record<string, string> = {
  PRIMEIRA_FASE: '1ª FASE',
  PLAYOFF: 'PLAYOFF',
  SEMIFINAL: 'SEMIFINAL',
  TERCEIRO_LUGAR: 'DISPUTA DE 3º LUGAR',
  FINAL: 'GRANDE FINAL',
}

const ink = { 950: '#0b0f14', 700: '#202834', 500: '#3d4a5e', 300: '#8493ac' }
const grid = '#b9c3d4'
const brand = '#0752b5'

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 8, fontFamily: 'Helvetica', color: ink[950] },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, paddingBottom: 6, borderBottom: `2pt solid ${brand}` },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  logo: { width: 26, height: 26, borderRadius: 4 },
  championshipName: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: brand },
  championshipSeason: { fontSize: 6.5, color: ink[500] },
  sumulaTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  sumulaSubtitle: { fontSize: 7, color: ink[500], textAlign: 'right' },

  matchInfoRow: { flexDirection: 'row', justifyContent: 'space-between', border: `0.6pt solid ${grid}`, borderRadius: 2, padding: 4, marginBottom: 5 },
  matchInfoItem: { flexDirection: 'column' },
  matchInfoLabel: { fontSize: 6, color: ink[500], textTransform: 'uppercase' },
  matchInfoValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold' },

  teamsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', border: `0.6pt solid ${grid}`, borderRadius: 2, padding: 5, marginBottom: 5 },
  teamBlock: { flexDirection: 'row', alignItems: 'center', gap: 5, width: '36%' },
  teamBlockReverse: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, width: '36%' },
  shield: { width: 22, height: 22, objectFit: 'contain' },
  shieldSmall: { width: 15, height: 15, objectFit: 'contain' },
  teamName: { fontSize: 9, fontFamily: 'Helvetica-Bold', flexShrink: 1 },
  vsBox: { width: '28%', alignItems: 'center' },
  vsLabel: { fontSize: 6.5, color: ink[500], marginBottom: 2 },
  resultBoxes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resultBox: { width: 20, height: 20, border: `1pt solid ${ink[950]}`, borderRadius: 2 },
  resultX: { fontSize: 9, fontFamily: 'Helvetica-Bold' },

  penRow: { flexDirection: 'row', alignItems: 'center', gap: 6, border: `0.6pt solid ${grid}`, borderRadius: 2, paddingVertical: 2, paddingHorizontal: 6, marginBottom: 5 },
  penLabel: { fontSize: 6.5, color: ink[500], textTransform: 'uppercase' },
  penBox: { width: 18, height: 11, border: `0.75pt solid ${ink[950]}`, borderRadius: 2 },

  teamTable: { border: `0.75pt solid ${ink[950]}`, borderRadius: 2, marginBottom: 5 },
  teamInfoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2f8', borderBottom: `0.75pt solid ${ink[950]}`, paddingVertical: 2, paddingHorizontal: 5, gap: 6 },
  teamInfoName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: brand, flex: 1 },
  teamInfoFaltasLabel: { fontSize: 6.5, color: ink[500], textTransform: 'uppercase' },
  teamInfoFaltasBox: { width: 20, height: 11, border: `0.75pt solid ${ink[950]}`, borderRadius: 2 },

  tableHeaderRow: { flexDirection: 'row', borderBottom: `0.9pt solid ${ink[950]}` },
  tableRow: { flexDirection: 'row', borderBottom: `0.5pt solid ${grid}`, minHeight: 12, paddingVertical: 1 },
  cellNum: { width: '7%', borderRight: `0.5pt solid ${grid}`, alignItems: 'center', justifyContent: 'center' },
  cellSign: { width: '19%', borderRight: `0.5pt solid ${grid}` },
  cellName: { width: '45%', borderRight: `0.5pt solid ${grid}`, paddingHorizontal: 3, justifyContent: 'center' },
  cellGols: { width: '9.66%', borderRight: `0.5pt solid ${grid}` },
  cellCA: { width: '9.66%', borderRight: `0.5pt solid ${grid}` },
  cellCV: { width: '9.66%' },
  headText: { fontSize: 6, fontFamily: 'Helvetica-Bold', color: brand, textTransform: 'uppercase', textAlign: 'center', paddingVertical: 1 },
  playerName: { fontSize: 7 },
  playerNameSuspended: { fontSize: 7, color: '#b3261e', fontFamily: 'Helvetica-Bold' },

  wideCell: { flex: 1, paddingHorizontal: 5, justifyContent: 'center' },
  wideCellText: { fontSize: 7, fontFamily: 'Helvetica-Bold' },

  refereeRow: { flexDirection: 'row', gap: 10, marginTop: 3 },
  refereeCol: { flex: 1, alignItems: 'center' },
  refereeLine: { width: '90%', borderBottom: `0.75pt solid ${ink[950]}`, marginTop: 9, marginBottom: 3 },
  refereeLabel: { fontSize: 6.5, color: ink[500] },

  footerNote: { position: 'absolute', bottom: 10, left: 24, right: 24, fontSize: 5.5, color: ink[300], textAlign: 'center' },
})

function TableHeader() {
  return (
    <View style={styles.tableHeaderRow}>
      <View style={styles.cellNum}><Text style={styles.headText}>Nº</Text></View>
      <View style={styles.cellSign}><Text style={styles.headText}>ASSINATURA</Text></View>
      <View style={styles.cellName}><Text style={styles.headText}>JOGADOR</Text></View>
      <View style={styles.cellGols}><Text style={styles.headText}>GOLS</Text></View>
      <View style={styles.cellCA}><Text style={styles.headText}>CA</Text></View>
      <View style={styles.cellCV}><Text style={styles.headText}>CV</Text></View>
    </View>
  )
}

function PlayerRow({ player, suspended }: { player: Player; suspended: boolean }) {
  return (
    <View style={styles.tableRow}>
      <View style={styles.cellNum} />
      <View style={styles.cellSign} />
      <View style={styles.cellName}>
        <Text style={suspended ? styles.playerNameSuspended : styles.playerName}>
          {player.fullName}
          {suspended ? '  (SUSPENSO)' : ''}
        </Text>
      </View>
      <View style={styles.cellGols} />
      <View style={styles.cellCA} />
      <View style={styles.cellCV} />
    </View>
  )
}

function WideInfoRow({ label }: { label: string }) {
  return (
    <View style={styles.tableRow}>
      <View style={styles.cellNum} />
      <View style={styles.cellSign} />
      <View style={styles.wideCell}>
        <Text style={styles.wideCellText}>{label}</Text>
      </View>
    </View>
  )
}

function TeamTable({
  team,
  players,
  coaches,
  registration,
  suspendedIds,
}: {
  team: Team | null
  players: Player[]
  coaches: Coach[]
  registration: RepresentativeRegistration | null
  suspendedIds: Set<string>
}) {
  const repNames = [registration?.rep1Name, registration?.rep2Name].filter(Boolean).join(' / ')
  const coachNames = coaches.map((c) => c.fullName).join(' / ')

  return (
    <View style={styles.teamTable}>
      <View style={styles.teamInfoRow}>
        {resolveTeamShield(team) && <Image style={styles.shieldSmall} src={absoluteUrl(resolveTeamShield(team))} />}
        <Text style={styles.teamInfoName}>TIME: {team?.name ?? 'A DEFINIR'}</Text>
        <Text style={styles.teamInfoFaltasLabel}>FALTAS:</Text>
        <View style={styles.teamInfoFaltasBox} />
      </View>

      <TableHeader />
      {players.map((player) => (
        <PlayerRow key={player.id} player={player} suspended={suspendedIds.has(player.id)} />
      ))}
      {players.length === 0 && (
        <View style={styles.tableRow}>
          <View style={styles.wideCell}>
            <Text style={{ fontSize: 7, color: ink[300] }}>Nenhum jogador cadastrado.</Text>
          </View>
        </View>
      )}
      <WideInfoRow label={`REPRESENTANTE: ${repNames || '—'}`} />
      <WideInfoRow label={`TÉCNICOS: ${coachNames || '—'}`} />
    </View>
  )
}

export function MatchReportDocument({
  config,
  match,
  teamA,
  teamB,
  playersA,
  playersB,
  coachesA,
  coachesB,
  registrationA,
  registrationB,
  suspendedIds,
}: {
  config: ChampionshipConfig
  match: Match
  teamA: Team | null
  teamB: Team | null
  playersA: Player[]
  playersB: Player[]
  coachesA: Coach[]
  coachesB: Coach[]
  registrationA: RepresentativeRegistration | null
  registrationB: RepresentativeRegistration | null
  suspendedIds: Set<string>
}) {
  const nameA = teamA?.name ?? 'A DEFINIR'
  const nameB = teamB?.name ?? 'A DEFINIR'

  return (
    <Document title={`Súmula ${match.matchNumber} — ${nameA} x ${nameB}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Image style={styles.logo} src={absoluteUrl(resolveChampionshipLogo(config.logoUrl))} />
            <View>
              <Text style={styles.championshipName}>{config.name}</Text>
              <Text style={styles.championshipSeason}>TEMPORADA {config.season}</Text>
            </View>
          </View>
          <View>
            <Text style={styles.sumulaTitle}>SÚMULA OFICIAL</Text>
            <Text style={styles.sumulaSubtitle}>Documento para preenchimento em campo</Text>
          </View>
        </View>

        <View style={styles.matchInfoRow}>
          <View style={styles.matchInfoItem}>
            <Text style={styles.matchInfoLabel}>Jogo</Text>
            <Text style={styles.matchInfoValue}>{match.matchNumber}</Text>
          </View>
          <View style={styles.matchInfoItem}>
            <Text style={styles.matchInfoLabel}>Fase</Text>
            <Text style={styles.matchInfoValue}>{PHASE_LABEL[match.phase] ?? match.phase}</Text>
          </View>
          <View style={styles.matchInfoItem}>
            <Text style={styles.matchInfoLabel}>Data</Text>
            <Text style={styles.matchInfoValue}>{match.date ? formatDate(match.date) : 'A definir'}</Text>
          </View>
          <View style={styles.matchInfoItem}>
            <Text style={styles.matchInfoLabel}>Horário</Text>
            <Text style={styles.matchInfoValue}>{match.time ?? 'A definir'}</Text>
          </View>
        </View>

        <View style={styles.teamsRow}>
          <View style={styles.teamBlock}>
            {resolveTeamShield(teamA) && <Image style={styles.shield} src={absoluteUrl(resolveTeamShield(teamA))} />}
            <Text style={styles.teamName}>{nameA}</Text>
          </View>
          <View style={styles.vsBox}>
            <Text style={styles.vsLabel}>RESULTADO FINAL</Text>
            <View style={styles.resultBoxes}>
              <View style={styles.resultBox} />
              <Text style={styles.resultX}>×</Text>
              <View style={styles.resultBox} />
            </View>
          </View>
          <View style={styles.teamBlockReverse}>
            {resolveTeamShield(teamB) && <Image style={styles.shield} src={absoluteUrl(resolveTeamShield(teamB))} />}
            <Text style={styles.teamName}>{nameB}</Text>
          </View>
        </View>

        <View style={styles.penRow}>
          <Text style={styles.penLabel}>Houve disputa de pênaltis?   SIM ( )   NÃO ( )   Se sim:</Text>
          <View style={styles.penBox} />
          <Text style={{ fontSize: 8 }}>×</Text>
          <View style={styles.penBox} />
        </View>

        <TeamTable team={teamA} players={playersA} coaches={coachesA} registration={registrationA} suspendedIds={suspendedIds} />
        <TeamTable team={teamB} players={playersB} coaches={coachesB} registration={registrationB} suspendedIds={suspendedIds} />

        <View style={styles.refereeRow}>
          <View style={styles.refereeCol}>
            <View style={styles.refereeLine} />
            <Text style={styles.refereeLabel}>Árbitro — nome e assinatura</Text>
          </View>
          <View style={styles.refereeCol}>
            <View style={styles.refereeLine} />
            <Text style={styles.refereeLabel}>Organização — nome e assinatura</Text>
          </View>
        </View>

        <Text style={styles.footerNote} fixed>
          {config.name} · Temporada {config.season} · Súmula gerada pelo sistema em {formatDate(new Date().toISOString())}
        </Text>
      </Page>
    </Document>
  )
}
