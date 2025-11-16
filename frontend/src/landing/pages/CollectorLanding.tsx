import CollectorCTASection from '@/landing/components/collector/CollectorCTASection'
import CollectorFeaturesSection from '@/landing/components/collector/CollectorFeaturesSection'
import CollectorHeroSection from '@/landing/components/collector/CollectorHeroSection'
import CollectorStatsSection from '@/landing/components/collector/CollectorStatsSection'
import { useSeo } from '@/shared/hooks/useSeo'

const CollectorLanding = () => {
  useSeo(
    'Collector Enterprise | Plataforma con IA para constructoras',
    'Collector Enterprise integra formularios, dashboards y visión computacional para digitalizar obras con detección automática de EPP y reportes fotográficos.',
  )

  return (
    <div className="flex flex-col">
      <CollectorHeroSection />
      <CollectorFeaturesSection />
      <CollectorStatsSection />
      <CollectorCTASection />
    </div>
  )
}

export default CollectorLanding


