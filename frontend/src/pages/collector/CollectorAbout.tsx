import {
  Camera,
  Handshake,
  Lightbulb,
  Rocket,
  Target,
  Workflow,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSeo } from '@/hooks/useSeo'

const milestones = [
  {
    year: '2023',
    title: 'Idea en aula',
    description:
      'Detectamos brechas operacionales visitando obras en Temuco y desarrollamos el primer prototipo de formularios digitales.',
    icon: Lightbulb,
    iconBg: 'bg-sky-500/15 text-sky-600',
  },
  {
    year: '2024',
    title: 'Primer piloto',
    description:
      'Digitalizamos formularios críticos y dashboards en dos obras, logrando visibilidad diaria para jefaturas y gerencia.',
    icon: Rocket,
    iconBg: 'bg-indigo-500/15 text-indigo-600',
  },
  {
    year: '2025',
    title: 'Visión computacional',
    description:
      'Integramos cámaras con IA que detectan EPP, alimentan reportes visuales y disparan alertas en tiempo real.',
    icon: Camera,
    iconBg: 'bg-teal-500/15 text-teal-600',
  },
]

const drivers = [
  {
    title: 'Impacto en terreno',
    description:
      'Diseñamos con jefes de obra y cuadrillas para eliminar papel, evitar reprocesos y entregar datos accionables.',
    icon: Target,
    iconBg: 'bg-teal-500/15 text-teal-600',
    glow: 'bg-teal-500/20',
  },
  {
    title: 'IA con propósito',
    description:
      'La visión computacional y los algoritmos de Collector se enfocan en seguridad, avance y KPIs que realmente importan.',
    icon: Workflow,
    iconBg: 'bg-indigo-500/15 text-indigo-600',
    glow: 'bg-indigo-500/20',
  },
  {
    title: 'Alianzas a largo plazo',
    description:
      'Acompañamos a las constructoras en adopción, capacitación y mejoras continuas. Estar en terreno es parte de nuestra cultura.',
    icon: Handshake,
    iconBg: 'bg-sky-500/15 text-sky-600',
    glow: 'bg-sky-500/20',
  },
]

const CollectorAbout = () => {
  useSeo(
    'Nosotros | Collector Enterprise',
    'Collector Enterprise nace de tres estudiantes de Ingeniería en Informática que transformaron la experiencia en terreno en una plataforma con IA.',
  )

  return (
    <div className="flex flex-col gap-12 pb-16">
      <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 py-16 text-white">
        <div className="container flex flex-col gap-4">
          <p className="text-sm uppercase tracking-[0.4em] text-white/70">
            Collector Enterprise
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">Somos tecnología con botas en obra</h1>
          <p className="max-w-3xl text-slate-100">
            Collector nació como un proyecto universitario de tres estudiantes de Ingeniería en
            Informática —Elías Ruiz, Renato Parra y Rafael Abello— que crecieron visitando faenas
            con sus familias. Hoy convertimos nuestra obsesión por la eficiencia en una plataforma
            que combina datos, IA y la realidad del terreno.
          </p>
        </div>
      </section>

      <div className="container flex flex-col gap-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              name: 'Elías Ruiz',
              role: 'Data & Producto',
              bio: 'Líder de visión computacional y analítica avanzada. Conecta cámaras, IA y dashboards accionables.',
            },
            {
              name: 'Renato Parra',
              role: 'Arquitectura de Software',
              bio: 'Diseña la plataforma cloud-native, asegura escalabilidad y la integra con los sistemas de cada constructora.',
            },
            {
              name: 'Rafael Abello',
              role: 'Operaciones & Cliente',
              bio: 'Facilita la adopción en terreno, capacita equipos de obra y traduce los procesos reales en workflows digitales.',
            },
          ].map((member) => (
            <Card
              key={member.name}
              className="border border-slate-200 bg-white/80 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  {member.name}
                </CardTitle>
                <p className="text-sm text-primary/80">{member.role}</p>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">{member.bio}</CardContent>
            </Card>
          ))}
        </div>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-slate-900">Nuestra evolución</h2>
          <div className="relative">
            <div className="absolute left-6 top-4 bottom-4 hidden w-0.5 rounded-full bg-gradient-to-b from-primary/40 via-primary/10 to-transparent md:block" />
            <div className="space-y-8">
              {milestones.map((milestone) => {
                const Icon = milestone.icon
                return (
                  <div
                    key={milestone.year}
                    className="relative rounded-3xl border border-white/60 bg-white/95 p-6 shadow-lg shadow-slate-900/10 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl md:ml-8 md:pl-10"
                  >
                    <div className="absolute left-[22px] top-8 hidden h-4 w-4 -translate-x-1/2 rounded-full border-4 border-white bg-primary shadow-md md:block" />
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                        {milestone.year}
                      </span>
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${milestone.iconBg}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">
                      {milestone.title}
                    </h3>
                    <p className="mt-3 text-sm text-slate-600">{milestone.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-slate-900">Lo que nos mueve</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {drivers.map((driver) => {
              const Icon = driver.icon
              return (
                <div
                  key={driver.title}
                  className="group relative h-full overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-slate-50 via-white to-white p-6 shadow-lg shadow-slate-900/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div
                    className={`pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full opacity-70 blur-3xl transition-opacity duration-300 group-hover:opacity-100 ${driver.glow}`}
                  />
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${driver.iconBg}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{driver.title}</h3>
                  <p className="mt-3 text-sm text-slate-600">{driver.description}</p>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

export default CollectorAbout


