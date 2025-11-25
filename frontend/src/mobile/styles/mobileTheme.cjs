/**
 * Plugin de Tailwind CSS para theme mobile
 * Extiende el theme con configuraciones optimizadas para dispositivos móviles
 * Inspirado en iOS Human Interface Guidelines y Material Design
 */

/** @type {import('tailwindcss').Config} */
const mobileTheme = {
  theme: {
    extend: {
      // Variables CSS custom para mobile
      spacing: {
        'header-height': 'var(--header-height, 56px)',
        'bottom-nav-height': 'var(--bottom-nav-height, 64px)',
        'safe-top': 'var(--safe-area-top, 0px)',
        'safe-bottom': 'var(--safe-area-bottom, 0px)',
        // Tap targets mínimos (iOS guidelines: 44x44px)
        'tap-target': '44px',
        'tap-target-sm': '40px', // Mínimo aceptable
      },

      // Typography mobile-friendly
      fontSize: {
        // Base más grande para mobile (16px mínimo para evitar zoom en iOS)
        base: ['16px', { lineHeight: '1.5', letterSpacing: '0' }],
        sm: ['14px', { lineHeight: '1.5', letterSpacing: '0' }],
        xs: ['12px', { lineHeight: '1.4', letterSpacing: '0.01em' }],
        // Headings más grandes y espaciados
        'mobile-h1': ['28px', { lineHeight: '1.3', letterSpacing: '-0.02em', fontWeight: '700' }],
        'mobile-h2': ['24px', { lineHeight: '1.35', letterSpacing: '-0.01em', fontWeight: '600' }],
        'mobile-h3': ['20px', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '600' }],
        'mobile-h4': ['18px', { lineHeight: '1.45', letterSpacing: '0', fontWeight: '600' }],
        'mobile-body': ['16px', { lineHeight: '1.5', letterSpacing: '0' }],
        'mobile-caption': ['14px', { lineHeight: '1.4', letterSpacing: '0.01em' }],
      },

      // Colores con alto contraste para exteriores
      colors: {
        // Colores adicionales para mejor visibilidad en exteriores
        'mobile-surface': 'hsl(var(--mobile-surface, var(--background)))',
        'mobile-elevated': 'hsl(var(--mobile-elevated, var(--card)))',
        'mobile-text-primary': 'hsl(var(--mobile-text-primary, var(--foreground)))',
        'mobile-text-secondary': 'hsl(var(--mobile-text-secondary, var(--muted-foreground)))',
      },

      // Sombras sutiles para mobile (no muy pesadas)
      boxShadow: {
        'mobile-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'mobile-md': '0 2px 4px 0 rgba(0, 0, 0, 0.08)',
        'mobile-lg': '0 4px 8px 0 rgba(0, 0, 0, 0.1)',
        'mobile-xl': '0 8px 16px 0 rgba(0, 0, 0, 0.12)',
        // Elevación para cards
        'mobile-card': '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
        'mobile-card-hover': '0 4px 12px 0 rgba(0, 0, 0, 0.12)',
      },

      // Animaciones mobile-friendly
      keyframes: {
        'slide-in-bottom': {
          '0%': {
            transform: 'translateY(100%)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        'slide-in-right': {
          '0%': {
            transform: 'translateX(100%)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        'slide-in-left': {
          '0%': {
            transform: 'translateX(-100%)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        'fade-in-up': {
          '0%': {
            transform: 'translateY(20px)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        'bounce-subtle': {
          '0%, 100%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(-10%)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
        'scale-in': {
          '0%': {
            transform: 'scale(0.95)',
            opacity: '0',
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1',
          },
        },
      },

      animation: {
        'slide-in-bottom': 'slide-in-bottom 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slide-in-left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in-up': 'fade-in-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-subtle': 'bounce-subtle 0.6s ease-in-out',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      },

      // Transiciones optimizadas para mobile
      transitionDuration: {
        'mobile-fast': '150ms',
        'mobile-normal': '300ms',
        'mobile-slow': '500ms',
      },

      transitionTimingFunction: {
        'mobile-ease': 'cubic-bezier(0.16, 1, 0.3, 1)', // iOS easing
        'mobile-ease-out': 'cubic-bezier(0.0, 0, 0.2, 1)', // Material easing
        'mobile-ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
      },
    },
  },

  // Plugin function para agregar utilidades y componentes
  plugin: function ({ addUtilities, addComponents, theme }) {
    // Utilidades de safe area
    addUtilities({
      '.safe-top': {
        paddingTop: 'var(--safe-area-top, env(safe-area-inset-top, 0px))',
      },
      '.safe-bottom': {
        paddingBottom: 'var(--safe-area-bottom, env(safe-area-inset-bottom, 0px))',
      },
      '.safe-left': {
        paddingLeft: 'var(--safe-area-left, env(safe-area-inset-left, 0px))',
      },
      '.safe-right': {
        paddingRight: 'var(--safe-area-right, env(safe-area-inset-right, 0px))',
      },
      '.safe-x': {
        paddingLeft: 'var(--safe-area-left, env(safe-area-inset-left, 0px))',
        paddingRight: 'var(--safe-area-right, env(safe-area-inset-right, 0px))',
      },
      '.safe-y': {
        paddingTop: 'var(--safe-area-top, env(safe-area-inset-top, 0px))',
        paddingBottom: 'var(--safe-area-bottom, env(safe-area-inset-bottom, 0px))',
      },
      '.safe-all': {
        paddingTop: 'var(--safe-area-top, env(safe-area-inset-top, 0px))',
        paddingRight: 'var(--safe-area-right, env(safe-area-inset-right, 0px))',
        paddingBottom: 'var(--safe-area-bottom, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'var(--safe-area-left, env(safe-area-inset-left, 0px))',
      },
    })

    // Utilidades de tap target (tamaño mínimo para toques)
    addUtilities({
      '.tap-target': {
        minWidth: '44px',
        minHeight: '44px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      '.tap-target-sm': {
        minWidth: '40px',
        minHeight: '40px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      '.tap-target-lg': {
        minWidth: '48px',
        minHeight: '48px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    })

    // Componentes mobile optimizados
    addComponents({
      // Card mobile optimizada
      '.mobile-card': {
        backgroundColor: theme('colors.card.DEFAULT'),
        borderRadius: theme('borderRadius.lg'),
        padding: theme('spacing.4'),
        boxShadow: theme('boxShadow.mobile-card'),
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        '&:active': {
          boxShadow: theme('boxShadow.mobile-card-hover'),
          transform: 'scale(0.98)',
        },
      },

      // Input mobile optimizado
      '.mobile-input': {
        fontSize: '16px', // Previene zoom en iOS
        lineHeight: '1.5',
        padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
        minHeight: '44px', // Tap target mínimo
        borderRadius: theme('borderRadius.md'),
        borderWidth: '1px',
        borderColor: theme('colors.border'),
        backgroundColor: theme('colors.background'),
        transition: 'all 0.2s ease',
        '&:focus': {
          outline: 'none',
          ringWidth: '2px',
          ringColor: theme('colors.ring'),
          ringOffsetWidth: '2px',
          ringOffsetColor: theme('colors.background'),
        },
        '&::placeholder': {
          color: theme('colors.muted.foreground'),
          opacity: '0.6',
        },
      },

      // Button mobile optimizado
      '.mobile-button': {
        minHeight: '44px',
        paddingLeft: theme('spacing.4'),
        paddingRight: theme('spacing.4'),
        fontSize: '16px',
        fontWeight: '600',
        borderRadius: theme('borderRadius.md'),
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        '&:active': {
          transform: 'scale(0.97)',
        },
      },

      // List item mobile
      '.mobile-list-item': {
        minHeight: '56px',
        padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
        display: 'flex',
        alignItems: 'center',
        gap: theme('spacing.3'),
        borderRadius: theme('borderRadius.md'),
        transition: 'background-color 0.2s ease',
        '&:active': {
          backgroundColor: theme('colors.accent.DEFAULT'),
        },
      },
    })
  },
}

module.exports = mobileTheme

