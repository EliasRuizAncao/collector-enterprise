import CTASection from '@/landing/components/landing/CTASection'
import FeaturesSection from '@/landing/components/landing/FeaturesSection'
import HeroSection from '@/landing/components/landing/HeroSection'
import StatsSection from '@/landing/components/landing/StatsSection'
import { useSeo } from '@/shared/hooks/useSeo'

// Página principal de Landing que agrupa todas las secciones públicas
const Landing = () => {
  useSeo(
    'Amaranto Constructora | Obras residenciales y comerciales en Chile',
    'Amaranto Constructora lidera proyectos residenciales y comerciales con equipos expertos, innovación y cumplimiento de alto nivel.',
  )

  return (
    <>
      {/* Secciones con scroll suave */}
      <div className="flex flex-col">
        <HeroSection />
        <FeaturesSection />
        <StatsSection />
        <CTASection />
      </div>
    </>
  )
}

export default Landing

