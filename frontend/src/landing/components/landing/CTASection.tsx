import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/shared/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { useToast } from '@/shared/components/ui/use-toast'

const ctaSchema = z.object({
  name: z.string().min(2, 'Ingresa tu nombre'),
  email: z
    .string()
    .email('Email inválido')
    .min(1, 'El email es requerido'),
  company: z.string().min(2, 'Ingresa el nombre de tu empresa'),
})

type CtaFormData = z.infer<typeof ctaSchema>

// Sección de llamada a la acción con formulario rápido
const CTASection = () => {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CtaFormData>({
    resolver: zodResolver(ctaSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
    },
  })

  const onSubmit = async (data: CtaFormData) => {
    try {
      setIsSubmitting(true)
      console.log('CTA submission:', data)

      toast({
        title: 'Gracias por tu interés',
        description: 'Nos pondremos en contacto contigo a la brevedad.',
      })

      form.reset()
    } catch (error) {
      console.error('CTA submission error:', error)
      toast({
        title: 'Ocurrió un error',
        description: 'Intenta nuevamente en unos minutos.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-900 to-cyan-700 py-20 text-white">
      <div className="absolute inset-0 opacity-40">
        <div className="absolute -top-12 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-teal-400 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-60 w-60 rounded-full bg-emerald-500 blur-3xl" />
      </div>

      <div className="container relative z-10 flex flex-col items-center gap-10 text-center">
        <div className="max-w-2xl space-y-4">
          <h2 className="text-3xl font-bold sm:text-4xl">
            ¿Listo para dar el siguiente paso con tu proyecto?
          </h2>
          <p className="text-base text-slate-200 sm:text-lg">
            Conversemos sobre el alcance, presupuesto y plazos que necesitas. Nuestro equipo técnico
            y de gestión te acompaña desde la planificación hasta la entrega llave en mano.
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex w-full flex-col gap-4 rounded-2xl bg-white/10 p-6 backdrop-blur-sm sm:flex-row sm:items-end"
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
                    <FormLabel>Email</FormLabel>
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
                        placeholder="Nombre de tu empresa"
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
              className="w-full bg-white text-teal-900 hover:bg-white/90 sm:w-auto"
            >
              {isSubmitting ? 'Enviando...' : 'Coordinar reunión'}
            </Button>
          </form>
        </Form>

        <p className="max-w-xl text-xs text-slate-300">
          Al completar el formulario nos contactaremos en menos de 24 horas hábiles para coordinar
          una reunión presencial o virtual. Resguardamos tu información según nuestras políticas de
          privacidad.
        </p>
      </div>
    </section>
  )
}

export default CTASection

