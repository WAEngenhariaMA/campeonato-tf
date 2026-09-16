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
  page: { padding: 22, fontSize: 7.5, fontFamily: 'Helvetica', color: ink[950] },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, paddingBottom: 6, borderBottom: `2pt solid ${brand}` },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  logo: { width: 26, height: 26, borderRadius: 4 },
  championshipName: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: brand },
  championshipSeason: { fontSize: 6.5, color: ink[500] },
  sumulaTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  sumulaSubtitle: { fontSize: 7, color: ink[500], textAlign: 'right' },

  matchInfoRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: ink[50], padding: 5, borderRadius: 3, marginBottom: 7 },
  matchInfoItem: { flexDirection: 'column' },
  matchInfoLabel: { fontSize: 6, color: ink[500], textTransform: 'uppercase' },
  matchInfoValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold' },

  teamsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  teamBlock: { flexDirection: 'row', alignItems: 'center', gap: 5, width: '38%' },
  teamBlockReverse: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, width: '38%' },
  shield: { width: 24, height: 24, objectFit: 'contain' },
  shieldSmall: { width: 16, height: 16, objectFit: 'contain' },
  teamName: { fontSize: 9, fontFamily: 'Helvetica-Bold', flexShrink: 1 },
  vsBox: { width: '24%', alignItems: 'center' },
  vsLabel: { fontSize: 6.5, color: ink[500], marginBottom: 2 },
  resultBoxes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resultBox: { width: 22, height: 22, border: `1.2pt solid ${ink[950]}`, borderRadius: 3 },
  resultX: { fontSize: 10, fontFamily: 'Helvetica-Bold' },

  extraRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  extraCol: { flex: 1, border: `0.75pt solid ${ink[300]}`, borderRadius: 3, paddingVertical: 3, paddingHorizontal: 5, flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  extraLabel: { fontSize: 6.5, color: ink[500], textTransform: 'uppercase' },
  extraLine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  blankBox: { width: 22, height: 12, border: `0.75pt solid ${ink[950]}`, borderRadius: 2 },

  teamSection: { border: `0.75pt solid ${ink[300]}`, borderRadius: 3, padding: 6, marginBottom: 6 },
  teamSectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, paddingBottom: 4, borderBottom: `0.75pt solid ${ink[100]}` },
  teamSectionTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: brand, textTransform: 'uppercase' },

  rosterAreaRow: { flexDirection: 'row', gap: 8 },
  rosterColumnsWrap: { flexDirection: 'row', gap: 8, flex: 2.3 },
  rosterSubCol: { flex: 1 },
  rosterHeaderRow: { flexDirection: 'row', backgroundColor: ink[950], color: 'white', paddingVertical: 2, paddingHorizontal: 2 },
  rosterRow: { flexDirection: 'row', alignItems: 'center', borderBottom: `0.6pt solid ${ink[300]}`, paddingVertical: 2, paddingHorizontal: 2, minHeight: 13 },
  colNumHeader: { width: '16%', fontSize: 6 },
  colNameHeader: { width: '52%', fontSize: 6 },
  colSignHeader: { width: '32%', fontSize: 6, textAlign: 'right' },
  numBox: { width: 14, height: 10, border: `0.6pt solid ${ink[950]}`, borderRadius: 1.5 },
  colNumWrap: { width: '16%' },
  colName: { width: '52%', fontSize: 7 },
  colNameSuspended: { width: '52%', fontSize: 7, color: '#b3261e', fontFamily: 'Helvetica-Bold' },
  colSign: { width: '32%' },

  sideBox: { flex: 1, border: `0.6pt solid ${ink[300]}`, borderRadius: 3, padding: 4 },
  sideBoxTitle: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: brand, textTransform: 'uppercase', marginBottom: 2, marginTop: 4 },
  sideBoxTitleFirst: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: brand, textTransform: 'uppercase', marginBottom: 2 },
  sideEventLine: { flexDirection: 'row', alignItems: 'center', gap: 3, borderBottom: `0.5pt solid ${ink[100]}`, paddingVertical: 1.5 },
  sideEventNumBox: { width: 14, height: 9, border: `0.6pt solid ${ink[950]}`, borderRadius: 1.5 },
  sideEventLabel: { fontSize: 6, color: ink[500] },

  peopleRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, rowGap: 3, marginTop: 4, paddingTop: 4, borderTop: `0.6pt solid ${ink[100]}` },
  peopleItem: { width: '23%' },
  peopleSignLine: { borderBottom: `0.6pt solid ${ink[300]}`, paddingBottom: 1.5, marginTop: 1 },
  peopleName: { fontSize: 6.5 },
  peopleLabel: { fontSize: 5.5, color: ink[500] },

  obsBox: { marginTop: 2, border: `0.75pt solid ${ink[300]}`, borderRadius: 3, padding: 5, minHeight: 24 },
  obsLabel: { fontSize: 6.5, color: ink[500], textTransform: 'uppercase', marginBottom: 2 },

  refereeRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  refereeCol: { flex: 1, alignItems: 'center' },
  refereeLine: { width: '90%', borderBottom: `0.75pt solid ${ink[950]}`, marginTop: 14, marginBottom: 3 },
  refereeLabel: { fontSize: 6.5, color: ink[500] },

  footerNote: { position: 'absolute', bottom: 10, left: 22, right: 22, fontSize: 5.5, color: ink[300], textAlign: 'center' },
})

function RosterSubColumn({ players, suspendedIds }: { players: Player[]; suspendedIds: Set<string> }) {
  return (
    <View style={styles.rosterSubCol}>
      <View style={styles.rosterHeaderRow}>
        <Text style={styles.colNumHeader}>Nº</Text>
        <Text style={styles.colNameHeader}>JOGADOR</Text>
        <Text style={styles.colSignHeader}>ASSINATURA</Text>
      </View>
      {players.map((player) => (
        <View style={styles.rosterRow} key={player.id}>
          <View style={styles.colNumWrap}>
            <View style={styles.numBox} />
          </View>
          <Text style={suspendedIds.has(player.id) ? styles.colNameSuspended : styles.colName}>
            {player.fullName}
            {suspendedIds.has(player.id) ? ' (SUSPENSO)' : ''}
          </Text>
          <View style={styles.colSign} />
        </View>
      ))}
    </View>
  )
}

function TeamEventsSideBox() {
  return (
    <View style={styles.sideBox}>
      <Text style={styles.sideBoxTitleFirst}>Gols — Nº</Text>
      {Array.from({ length: 5 }).map((_, i) => (
        <View style={styles.sideEventLine} key={`g${i}`}>
          <View style={styles.sideEventNumBox} />
          <Text style={styles.sideEventLabel}>{i + 1}º gol</Text>
        </View>
      ))}
      <Text style={styles.sideBoxTitle}>Cartão amarelo — Nº</Text>
      {Array.from({ length: 4 }).map((_, i) => (
        <View style={styles.sideEventLine} key={`a${i}`}>
          <View style={styles.sideEventNumBox} />
        </View>
      ))}
      <Text style={styles.sideBoxTitle}>Cartão vermelho — Nº</Text>
      {Array.from({ length: 3 }).map((_, i) => (
        <View style={styles.sideEventLine} key={`v${i}`}>
          <View style={styles.sideEventNumBox} />
        </View>
      ))}
    </View>
  )
}

function TeamSection({
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
  const half = Math.ceil(players.length / 2)
  const colA = players.slice(0, half)
  const colB = players.slice(half)

  const people: { label: string; name: string }[] = []
  if (registration) {
    people.push({ label: 'Representante 1', name: registration.rep1Name })
    if (registration.rep2Name) people.push({ label: 'Representante 2', name: registration.rep2Name })
  }
  coaches.forEach((coach, i) => people.push({ label: coaches.length > 1 ? `Técnico ${i + 1}` : 'Técnico', name: coach.fullName }))

  return (
    <View style={styles.teamSection}>
      <View style={styles.teamSectionHeaderRow}>
        {resolveTeamShield(team) && <Image style={styles.shieldSmall} src={absoluteUrl(resolveTeamShield(team))} />}
        <Text style={styles.teamSectionTitle}>{team?.name ?? 'A DEFINIR'}</Text>
      </View>

      <View style={styles.rosterAreaRow}>
        <View style={styles.rosterColumnsWrap}>
          <RosterSubColumn players={colA} suspendedIds={suspendedIds} />
          <RosterSubColumn players={colB} suspendedIds={suspendedIds} />
        </View>
        <TeamEventsSideBox />
      </View>

      {people.length > 0 && (
        <View style={styles.peopleRow}>
          {people.map((person) => (
            <View style={styles.peopleItem} key={person.label}>
              <Text style={styles.peopleLabel}>{person.label} — assinatura</Text>
              <View style={styles.peopleSignLine}>
                <Text style={styles.peopleName}>{person.name}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
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
            <Text style={styles.extraLabel}>Pênaltis:</Text>
            <Text style={{ fontSize: 6.5 }}>SIM ( )   NÃO ( )</Text>
            <View style={styles.extraLine}>
              <View style={styles.blankBox} />
              <Text style={{ fontSize: 7 }}>×</Text>
              <View style={styles.blankBox} />
            </View>
          </View>
          <View style={styles.extraCol}>
            <Text style={styles.extraLabel}>Faltas:</Text>
            <View style={styles.extraLine}>
              <Text style={{ fontSize: 6.5 }}>{nameA}</Text>
              <View style={styles.blankBox} />
            </View>
            <View style={styles.extraLine}>
              <Text style={{ fontSize: 6.5 }}>{nameB}</Text>
              <View style={styles.blankBox} />
            </View>
          </View>
        </View>

        <TeamSection team={teamA} players={playersA} coaches={coachesA} registration={registrationA} suspendedIds={suspendedIds} />
        <TeamSection team={teamB} players={playersB} coaches={coachesB} registration={registrationB} suspendedIds={suspendedIds} />

        <View style={styles.obsBox}>
          <Text style={styles.obsLabel}>Observações da organização / arbitragem</Text>
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
