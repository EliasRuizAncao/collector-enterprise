import CTASection from '@/components/landing/CTASection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import HeroSection from '@/components/landing/HeroSection'
import StatsSection from '@/components/landing/StatsSection'
import { useSeo } from '@/hooks/useSeo'

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

