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

const ink = { 950: '#0b0f14', 700: '#202834', 500: '#3d4a5e', 300: '#8493ac', 100: '#e6eaf2', 50: '#f5f7fb' }
const brand = '#0752b5'

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 8.5, fontFamily: 'Helvetica', color: ink[950] },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottom: `2pt solid ${brand}` },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 32, height: 32, borderRadius: 4 },
  championshipName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: brand },
  championshipSeason: { fontSize: 7, color: ink[500] },
  sumulaTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  sumulaSubtitle: { fontSize: 7.5, color: ink[500], textAlign: 'right' },

  matchInfoRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: ink[50], padding: 6, borderRadius: 3, marginBottom: 10 },
  matchInfoItem: { flexDirection: 'column' },
  matchInfoLabel: { fontSize: 6, color: ink[500], textTransform: 'uppercase' },
  matchInfoValue: { fontSize: 9, fontFamily: 'Helvetica-Bold' },

  teamsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  teamBlock: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '38%' },
  teamBlockReverse: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, width: '38%' },
  shield: { width: 30, height: 30, objectFit: 'contain' },
  teamName: { fontSize: 10, fontFamily: 'Helvetica-Bold', flexShrink: 1 },
  vsBox: { width: '24%', alignItems: 'center' },
  vsLabel: { fontSize: 7, color: ink[500], marginBottom: 3 },
  resultBoxes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resultBox: { width: 26, height: 26, border: `1.2pt solid ${ink[950]}`, borderRadius: 3 },
  resultX: { fontSize: 11, fontFamily: 'Helvetica-Bold' },

  extraRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  extraCol: { flex: 1, border: `0.75pt solid ${ink[300]}`, borderRadius: 3, padding: 6 },
  extraLabel: { fontSize: 6.5, color: ink[500], textTransform: 'uppercase', marginBottom: 3 },
  extraLine: { flexDirection: 'row', gap: 6 },
  blankBox: { width: 30, height: 14, border: `0.75pt solid ${ink[950]}`, borderRadius: 2 },

  sectionTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: brand, marginBottom: 4, marginTop: 8, textTransform: 'uppercase' },

  rostersRow: { flexDirection: 'row', gap: 10 },
  rosterCol: { flex: 1 },
  rosterHeaderRow: { flexDirection: 'row', backgroundColor: ink[950], color: 'white', paddingVertical: 3, paddingHorizontal: 3 },
  rosterRow: { flexDirection: 'row', borderBottom: `0.5pt solid ${ink[100]}`, paddingVertical: 2.5, paddingHorizontal: 3 },
  rosterRowSuspended: { flexDirection: 'row', borderBottom: `0.5pt solid ${ink[100]}`, paddingVertical: 2.5, paddingHorizontal: 3, backgroundColor: '#fdeceb' },
  colNum: { width: '10%', fontFamily: 'Helvetica-Bold' },
  colName: { width: '68%' },
  colSusp: { width: '22%', fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#b3261e' },

  eventsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  eventsCol: { flex: 1 },
  eventsHeaderRow: { flexDirection: 'row', backgroundColor: ink[950], color: 'white', paddingVertical: 3, paddingHorizontal: 3 },
  eventsRowLine: { flexDirection: 'row', borderBottom: `0.5pt solid ${ink[100]}`, paddingVertical: 4.5, paddingHorizontal: 3 },
  eventsColSeq: { width: '10%', color: ink[300] },
  eventsColNum: { width: '18%' },
  eventsColTeam: { width: '30%' },
  eventsColType: { width: '42%' },

  peopleRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  peopleCol: { flex: 1, border: `0.75pt solid ${ink[300]}`, borderRadius: 3, padding: 6 },
  peopleTeamName: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  signLine: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: `0.5pt solid ${ink[300]}`, paddingBottom: 2, marginBottom: 5 },
  signLabel: { fontSize: 6.5, color: ink[500] },
  signName: { fontSize: 7.5 },

  refereeRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  refereeCol: { flex: 1, alignItems: 'center' },
  refereeLine: { width: '90%', borderBottom: `0.75pt solid ${ink[950]}`, marginTop: 18, marginBottom: 3 },
  refereeLabel: { fontSize: 7, color: ink[500] },

  obsBox: { marginTop: 8, border: `0.75pt solid ${ink[300]}`, borderRadius: 3, padding: 6, minHeight: 34 },
  obsLabel: { fontSize: 6.5, color: ink[500], textTransform: 'uppercase', marginBottom: 3 },

  footerNote: { position: 'absolute', bottom: 16, left: 28, right: 28, fontSize: 6, color: ink[300], textAlign: 'center' },
})

function Roster({ title, players, suspendedIds }: { title: string; players: Player[]; suspendedIds: Set<string> }) {
  return (
    <View style={styles.rosterCol}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.rosterHeaderRow}>
        <Text style={styles.colNum}>Nº</Text>
        <Text style={styles.colName}>JOGADOR</Text>
        <Text style={styles.colSusp}>SITUAÇÃO</Text>
      </View>
      {players.map((player, index) => (
        <View style={suspendedIds.has(player.id) ? styles.rosterRowSuspended : styles.rosterRow} key={player.id}>
          <Text style={styles.colNum}>{index + 1}</Text>
          <Text style={styles.colName}>{player.fullName}</Text>
          <Text style={styles.colSusp}>{suspendedIds.has(player.id) ? 'SUSPENSO' : ''}</Text>
        </View>
      ))}
      {players.length === 0 && <Text style={{ padding: 4, color: ink[300] }}>Nenhum jogador cadastrado.</Text>}
    </View>
  )
}

function EventsTable({ title, rows = 10 }: { title: string; rows?: number }) {
  return (
    <View style={styles.eventsCol}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.eventsHeaderRow}>
        <Text style={styles.eventsColSeq}>#</Text>
        <Text style={styles.eventsColNum}>Nº JOGADOR</Text>
        <Text style={styles.eventsColTeam}>TIME</Text>
        <Text style={styles.eventsColType}>{title === 'GOLS' ? 'OBSERVAÇÃO' : 'AMARELO / VERMELHO'}</Text>
      </View>
      {Array.from({ length: rows }).map((_, i) => (
        <View style={styles.eventsRowLine} key={i}>
          <Text style={styles.eventsColSeq}>{i + 1}</Text>
          <Text style={styles.eventsColNum} />
          <Text style={styles.eventsColTeam} />
          <Text style={styles.eventsColType} />
        </View>
      ))}
    </View>
  )
}

function PeopleSignatures({
  teamName,
  registration,
  coaches,
}: {
  teamName: string
  registration: RepresentativeRegistration | null
  coaches: Coach[]
}) {
  const rows: { label: string; name: string }[] = []
  if (registration) {
    rows.push({ label: 'Representante 1', name: registration.rep1Name })
    if (registration.rep2Name) rows.push({ label: 'Representante 2', name: registration.rep2Name })
  }
  coaches.forEach((coach, i) => rows.push({ label: coaches.length > 1 ? `Técnico ${i + 1}` : 'Técnico', name: coach.fullName }))

  return (
    <View style={styles.peopleCol}>
      <Text style={styles.peopleTeamName}>{teamName}</Text>
      {rows.length === 0 && <Text style={{ color: ink[300] }}>Nenhum representante ou técnico cadastrado.</Text>}
      {rows.map((row) => (
        <View style={styles.signLine} key={row.label}>
          <Text style={styles.signName}>{row.name}</Text>
          <Text style={styles.signLabel}>{row.label} — assinatura</Text>
        </View>
      ))}
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

        <View style={styles.extraRow}>
          <View style={styles.extraCol}>
            <Text style={styles.extraLabel}>Disputa de pênaltis</Text>
            <Text style={{ marginBottom: 4 }}>Houve pênaltis?   SIM ( )   NÃO ( )</Text>
            <View style={styles.extraLine}>
              <Text>Se sim:</Text>
              <View style={styles.blankBox} />
              <Text style={{ paddingTop: 3 }}>×</Text>
              <View style={styles.blankBox} />
            </View>
          </View>
          <View style={styles.extraCol}>
            <Text style={styles.extraLabel}>Faltas cometidas</Text>
            <View style={styles.extraLine}>
              <Text>{nameA}:</Text>
              <View style={styles.blankBox} />
              <Text>{nameB}:</Text>
              <View style={styles.blankBox} />
            </View>
          </View>
        </View>

        <View style={styles.rostersRow}>
          <Roster title={`ELENCO — ${nameA}`} players={playersA} suspendedIds={suspendedIds} />
          <Roster title={`ELENCO — ${nameB}`} players={playersB} suspendedIds={suspendedIds} />
        </View>

        <View style={styles.eventsRow}>
          <EventsTable title="GOLS" rows={10} />
          <EventsTable title="CARTÕES" rows={8} />
        </View>

        <View style={styles.obsBox}>
          <Text style={styles.obsLabel}>Observações da organização / arbitragem</Text>
        </View>

        <View style={styles.peopleRow}>
          <PeopleSignatures teamName={nameA} registration={registrationA} coaches={coachesA} />
          <PeopleSignatures teamName={nameB} registration={registrationB} coaches={coachesB} />
        </View>

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
