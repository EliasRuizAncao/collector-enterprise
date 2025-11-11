import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Sección Hero de la landing con foco en impacto visual y CTA claros
const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-900 to-cyan-700 text-white">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -left-1/4 top-1/4 h-64 w-64 rounded-full bg-teal-400 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 rounded-full bg-cyan-300 blur-3xl" />
        <div className="absolute -right-1/4 bottom-0 h-80 w-80 rounded-full bg-emerald-500 blur-3xl" />
      </div>

      <div className="container relative z-10 flex flex-col items-center gap-12 py-20 md:flex-row md:items-stretch md:py-24">
        <div className="flex flex-1 flex-col items-start gap-6 text-left">
          <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-sm font-medium uppercase tracking-wide backdrop-blur-sm">
            Amaranto Constructora · Ingeniería que inspira confianza
          </span>

          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-white animate-in fade-in slide-in-from-bottom-4 sm:text-5xl lg:text-6xl">
            Construimos espacios que impulsan el crecimiento de Chile
          </h1>

          <p className="max-w-2xl text-lg text-slate-200 animate-in fade-in slide-in-from-bottom-6">
            Somos una constructora chilena con más de una década materializando proyectos
            residenciales y comerciales. Gestionamos 3 a 5 obras simultáneas con equipos de alto
            desempeño, visibilidad integral y estándares de seguridad que nos diferencian.
          </p>

          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-8 sm:flex-row">
            <Button asChild size="lg" className="bg-white text-teal-900 hover:bg-white/90">
              <Link to="/contacto">Hablemos de tu proyecto</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className={cn(
                'border-white/40 bg-white/10 text-white hover:bg-white hover:text-teal-900',
              )}
            >
              <Link to="/nosotros">Conoce nuestra historia</Link>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-slate-200">
            <div>
              <p className="text-3xl font-bold text-white">10+</p>
              <p>Años liderando proyectos</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">3-5</p>
              <p>Obras gestionadas a la vez</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">150</p>
              <p>Profesionales y técnicos</p>
            </div>
          </div>
        </div>

        {/* Placeholder para ilustración */}
        <div className="flex flex-1 items-center justify-center">
          <div className="relative h-[320px] w-[320px] animate-in fade-in zoom-in-95 sm:h-[360px] sm:w-[360px]">
            <div className="absolute inset-0 rounded-3xl bg-white/10 backdrop-blur-lg" />
            <div className="absolute inset-4 rounded-3xl border border-white/20 bg-gradient-to-br from-white/20 via-white/5 to-transparent" />
            <div className="absolute inset-8 flex flex-col items-center justify-center gap-3 text-center text-white">
              <span className="text-xs uppercase tracking-wide text-white/70">
                Vista previa
              </span>
              <p className="text-xl font-semibold">Dashboard Inteligente</p>
              <p className="max-w-xs text-sm text-white/70">
                KPIs en tiempo real, formularios asignados y actividad reciente para cada obra.
                Ilustración en desarrollo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection

