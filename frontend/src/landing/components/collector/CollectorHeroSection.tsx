import { Link } from 'react-router-dom'

import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

const CollectorHeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 text-white">
      <div className="absolute inset-0 opacity-40">
        <div className="absolute -left-1/4 top-1/4 h-64 w-64 rounded-full bg-sky-500 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 rounded-full bg-cyan-400 blur-3xl" />
        <div className="absolute -right-1/4 bottom-0 h-80 w-80 rounded-full bg-indigo-500 blur-3xl" />
      </div>

      <div className="container relative z-10 flex flex-col items-center gap-12 py-20 md:flex-row md:items-stretch md:py-24">
        <div className="flex flex-1 flex-col items-start gap-6 text-left">
          <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-sm font-medium uppercase tracking-wide backdrop-blur-sm">
            Collector Enterprise · Plataforma operativa inteligente
          </span>

          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-white animate-in fade-in slide-in-from-bottom-4 sm:text-5xl lg:text-6xl">
            Digitaliza obra, seguridad y gestión con inteligencia artificial
          </h1>

          <p className="max-w-2xl text-lg text-slate-200 animate-in fade-in slide-in-from-bottom-6">
            Collector centraliza formularios en terreno, dashboards estratégicos y automatiza
            reportes visuales con IA. Controla cada obra con cámaras inteligentes que detectan EPP,
            alertas en tiempo real y evidencia fotográfica lista para auditar.
          </p>

          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-8 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/collector/contacto">Solicitar demostración</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className={cn(
                'border-white/40 bg-white/10 text-white hover:bg-white hover:text-slate-900',
              )}
            >
              <a href="#collector-features">Ver funcionalidades</a>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-slate-200">
            <div>
              <p className="text-3xl font-bold text-white">+18</p>
              <p>Tipos de campos inteligentes</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">IA</p>
              <p>Detección EPP + reportes visuales</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">360°</p>
              <p>Seguimiento ejecutivo en tiempo real</p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="relative h-[320px] w-[320px] animate-in fade-in zoom-in-95 sm:h-[360px] sm:w-[360px]">
            <div className="absolute inset-0 rounded-3xl bg-white/10 backdrop-blur-lg" />
            <div className="absolute inset-4 rounded-3xl border border-white/20 bg-gradient-to-br from-white/20 via-white/5 to-transparent" />
            <div className="absolute inset-8 flex flex-col items-center justify-center gap-3 text-center text-white">
              <span className="text-xs uppercase tracking-wide text-white/70">
                Vista previa
              </span>
              <p className="text-xl font-semibold">Control de obra con IA</p>
              <p className="max-w-xs text-sm text-white/70">
                Monitorea cuadrillas, EPP obligatorio y avance fotográfico. Evidence center listo
                para auditores, clientes y comités de avance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CollectorHeroSection


