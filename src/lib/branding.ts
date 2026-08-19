/** Caminho compatível com desenvolvimento local e GitHub Pages (/campeonato-tf/). */
export const CHAMPIONSHIP_LOGO = `${import.meta.env.BASE_URL}copa-cohatrac-tf.jpg`

/** Compatibilidade com valores antigos salvos na configuração do campeonato. */
export function resolveChampionshipLogo(url: string | null | undefined) {
  return !url || url === '/copa-cohatrac-tf.jpg' || url === 'copa-cohatrac-tf.jpg' ? CHAMPIONSHIP_LOGO : url
}
