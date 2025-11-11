import {
  Activity,
  BellRing,
  BrainCircuit,
  Camera,
  FileSpreadsheet,
  Workflow,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const collectorFeatures = [
  {
    title: 'Constructor de formularios avanzado',
    description:
      '18+ tipos de campos, reglas condicionales y versionado automático para operaciones en obra.',
    icon: Workflow,
    accent: 'from-sky-50 via-white to-white',
    iconBg: 'bg-sky-500/15 text-sky-600',
    glow: 'bg-sky-500/25',
    badge: 'Operaciones',
  },
  {
    title: 'Cámaras con IA para EPP',
    description:
      'Detección automática de cascos, chalecos y elementos críticos con alertas inmediatas a terreno.',
    icon: Camera,
    accent: 'from-teal-50 via-white to-white',
    iconBg: 'bg-teal-500/15 text-teal-600',
    glow: 'bg-teal-500/25',
    badge: 'Seguridad',
  },
  {
    title: 'Reportes visuales con IA',
    description:
      'Evidencia fotográfica procesada automáticamente: antes/después, porcentajes de avance y hallazgos prioritarios.',
    icon: BrainCircuit,
    accent: 'from-indigo-50 via-white to-white',
    iconBg: 'bg-indigo-500/15 text-indigo-600',
    glow: 'bg-indigo-500/25',
    badge: 'Inteligencia artificial',
  },
  {
    title: 'Dashboards ejecutivos en vivo',
    description:
      'KPIs de cumplimiento, productividad y costos con drill-down por obra, contratista y equipo.',
    icon: Activity,
    accent: 'from-blue-50 via-white to-white',
    iconBg: 'bg-blue-500/15 text-blue-600',
    glow: 'bg-blue-500/25',
    badge: 'Analítica',
  },
  {
    title: 'Workflows y notificaciones',
    description:
      'Asignaciones automáticas, recordatorios y aprobaciones digitales integradas con correo y app móvil.',
    icon: BellRing,
    accent: 'from-cyan-50 via-white to-white',
    iconBg: 'bg-cyan-500/15 text-cyan-600',
    glow: 'bg-cyan-500/25',
    badge: 'Automatización',
  },
  {
    title: 'Reportes y analítica listos para comité',
    description:
      'Exporta a PDF/Excel con insights curados y storytelling visual para presentar en directorios.',
    icon: FileSpreadsheet,
    accent: 'from-violet-50 via-white to-white',
    iconBg: 'bg-violet-500/15 text-violet-600',
    glow: 'bg-violet-500/25',
    badge: 'Dirección',
  },
]

const CollectorFeaturesSection = () => {
  return (
    <section
      id="collector-features"
      className="relative overflow-hidden bg-slate-50 py-20 text-slate-900"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12)_0,_transparent_60%)]" />
      <div className="container relative z-10 flex flex-col gap-12">
        <div className="mx-auto max-w-2xl text-center">
          <span className="rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Plataforma
          </span>
          <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
            Inteligencia operativa de punta a punta
          </h2>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">
            Collector combina captura de datos en terreno, visión computacional y analítica avanzada
            para que cada decisión se tome con contexto y evidencia.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collectorFeatures.map((feature) => (
            <Card
              key={feature.title}
              className={cn(
                'group relative h-full overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br p-6 shadow-lg shadow-slate-900/10 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl',
                feature.accent,
              )}
            >
              <div
                className={cn(
                  'pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full opacity-60 blur-3xl transition-opacity duration-300 group-hover:opacity-90',
                  feature.glow,
                )}
              />
              <CardHeader className="flex flex-col gap-4 p-0">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300 group-hover:scale-105',
                    feature.iconBg,
                  )}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                {feature.badge && (
                  <span className="inline-flex items-center rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    {feature.badge}
                  </span>
                )}
                <CardTitle className="text-xl font-semibold text-slate-900">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                <p className="text-sm text-slate-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CollectorFeaturesSection


