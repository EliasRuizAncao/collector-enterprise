import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'

const collectorCtaSchema = z.object({
  name: z.string().min(2, 'Ingresa tu nombre'),
  email: z.string().email('Email inválido'),
  company: z.string().min(2, 'Ingresa el nombre de tu empresa'),
})

type CollectorCtaFormData = z.infer<typeof collectorCtaSchema>

const CollectorCTASection = () => {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CollectorCtaFormData>({
    resolver: zodResolver(collectorCtaSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
    },
  })

  const onSubmit = async (data: CollectorCtaFormData) => {
    try {
      setIsSubmitting(true)
      console.log('Collector CTA submission:', data)
      toast({
        title: 'Gracias por tu interés',
        description: 'Agenda recibida, un miembro del equipo te contactará en breve.',
      })
      form.reset()
    } catch (error) {
      console.error('Collector CTA error:', error)
      toast({
        title: 'Ocurrió un problema',
        description: 'Intenta nuevamente en unos minutos.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 py-20 text-white">
      <div className="absolute inset-0 opacity-40">
        <div className="absolute -top-12 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-500 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-60 w-60 rounded-full bg-cyan-500 blur-3xl" />
      </div>

      <div className="container relative z-10 flex flex-col items-center gap-10 text-center">
        <div className="max-w-2xl space-y-4">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Programa un piloto y mide el impacto desde el día uno
          </h2>
          <p className="text-base text-slate-200 sm:text-lg">
            En 4 semanas conectamos tus obras, configuramos los workflows clave y activamos
            detección automática de EPP. Obtén reportes ejecutivos con IA listos para tus comités.
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex w-full flex-col gap-4 rounded-2xl bg-white/10 p-6 backdrop-blur sm:flex-row sm:items-end"
          >
            <div className="grid flex-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre completo"
                        autoComplete="name"
                        className="bg-white/90 text-slate-900"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email corporativo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="tu.email@empresa.cl"
                        type="email"
                        autoComplete="email"
                        className="bg-white/90 text-slate-900"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre de tu constructora"
                        className="bg-white/90 text-slate-900"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Agendando...' : 'Agendar piloto'}
            </Button>
          </form>
        </Form>

        <p className="max-w-xl text-xs text-slate-300">
          Firmamos NDA antes de conectar tus datos. Sin costos ocultos: paga solo si la prueba
          demuestra el ROI acordado.
        </p>
      </div>
    </section>
  )
}

export default CollectorCTASection


