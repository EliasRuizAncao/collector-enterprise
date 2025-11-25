import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { Slot } from '@radix-ui/react-slot'
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'

import { cn } from '@/shared/lib/utils'

const Form = FormProvider

const FormFieldContext = React.createContext<{ name: string }>({ name: '' })
const FormItemContext = React.createContext<{ id: string }>({ id: '' })

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => (
  <FormFieldContext.Provider value={{ name: props.name.toString() }}>
    <Controller {...props} />
  </FormFieldContext.Provider>
)
FormField.displayName = 'FormField'

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn('space-y-2', className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = 'FormItem'

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>')
    }

  const { getFieldState, formState } = useFormContext()
  const fieldState = getFieldState(fieldContext.name, formState)

  return {
    id: itemContext.id,
    name: fieldContext.name,
    ...fieldState,
  }
}

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { id, error } = useFormField()

  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(error ? 'text-destructive' : '', className)}
      htmlFor={id}
      {...props}
    />
  )
})
FormLabel.displayName = 'FormLabel'

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { id } = useFormField()
  return <Slot ref={ref} id={id} {...props} />
})
FormControl.displayName = 'FormControl'

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { id } = useFormField()

  return (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      id={`${id}-description`}
      {...props}
    />
  )
})
FormDescription.displayName = 'FormDescription'

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, id } = useFormField()
  const body = error ? String(error?.message) : children

  return body ? (
    <p
      ref={ref}
      className={cn('text-sm font-medium text-destructive', className)}
      id={`${id}-message`}
      {...props}
    >
      {body}
    </p>
  ) : null
})
FormMessage.displayName = 'FormMessage'

export {
  Form,
  FormItem,
  useFormField,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}

