import { useEffect, useState } from 'react'
import { BadgeCheck, Cpu, Layers, Timer } from 'lucide-react'

interface CollectorStat {
  label: string
  value: number
  suffix?: string
  icon: React.ElementType
}

const stats: CollectorStat[] = [
  {
    label: 'Formularios procesados al mes',
    value: 18000,
    suffix: '+',
    icon: Layers,
  },
  {
    label: 'Alertas EPP resueltas',
    value: 92,
    suffix: '%',
    icon: BadgeCheck,
  },
  {
    label: 'Reportes automáticos en minutos',
    value: 5,
    icon: Timer,
  },
  {
    label: 'Accuracy visión computacional',
    value: 97,
    suffix: '%',
    icon: Cpu,
  },
]

const useCounter = (target: number, duration = 1200) => {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let start: number | null = null
    const step = (timestamp: number) => {
      if (!start) {
        start = timestamp
      }
      const progress = timestamp - start
      const percentage = Math.min(progress / duration, 1)
      const current = Math.floor(percentage * target)
      setValue(current)
      if (percentage < 1) {
        window.requestAnimationFrame(step)
      } else {
        setValue(target)
      }
    }

    window.requestAnimationFrame(step)

    return () => {
      setValue(0)
    }
  }, [target, duration])

  return value
}

const CollectorStatsSection = () => {
  return (
    <section className="bg-slate-900 py-20 text-white">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Resultados medibles en menos de 90 días
          </h2>
          <p className="mt-4 text-base text-slate-300 sm:text-lg">
            Collector reduce tiempos de supervisión, automatiza reportes fotográficos y mejora la
            seguridad operacional con datos que hablan solos.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat) => {
            const animatedValue = useCounter(stat.value)
            const Icon = stat.icon

            return (
              <div
                key={stat.label}
                className="group relative overflow-hidden rounded-2xl bg-white/5 p-8 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:bg-white/10"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-primary/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-white group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                    {animatedValue.toLocaleString('es-CL')}
                    {stat.suffix}
                  </p>
                  <p className="text-sm font-medium uppercase tracking-wide text-slate-300">
                    {stat.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default CollectorStatsSection


