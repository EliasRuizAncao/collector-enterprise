/**
 * Utilidades para autenticación biométrica
 * Soporte para WebAuthn API
 */

/**
 * Tipos de autenticación biométrica soportados
 */
export type BiometricType = 'face-id' | 'touch-id' | 'fingerprint' | 'none'

/**
 * Verificar si la autenticación biométrica está disponible
 */
export const isBiometricAvailable = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false
  }

  try {
    // Verificar si WebAuthn está disponible
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    return available
  } catch (error) {
    console.error('Error verificando autenticación biométrica:', error)
    return false
  }
}

/**
 * Detectar tipo de autenticación biométrica disponible
 */
export const detectBiometricType = (): BiometricType => {
  if (typeof window === 'undefined') {
    return 'none'
  }

  const userAgent = navigator.userAgent.toLowerCase()
  const platform = navigator.platform.toLowerCase()

  // iOS
  if (/iphone|ipad|ipod/.test(userAgent)) {
    // Face ID (iPhone X y posteriores)
    if (/iphone/.test(userAgent) && !/iphone [1-9]|iphone 1[0-9]/.test(userAgent)) {
      return 'face-id'
    }
    // Touch ID (iPhone 5s - iPhone 8, iPad)
    return 'touch-id'
  }

  // Android
  if (/android/.test(userAgent)) {
    return 'fingerprint'
  }

  return 'none'
}

/**
 * Obtener nombre legible del tipo biométrico
 */
export const getBiometricTypeName = (type: BiometricType): string => {
  switch (type) {
    case 'face-id':
      return 'Face ID'
    case 'touch-id':
      return 'Touch ID'
    case 'fingerprint':
      return 'Huella dactilar'
    default:
      return 'No disponible'
  }
}

/**
 * Registrar credencial biométrica
 */
export const registerBiometric = async (
  userId: string,
  challenge: string,
): Promise<PublicKeyCredential> => {
  if (!window.PublicKeyCredential) {
    throw new Error('Autenticación biométrica no disponible en este dispositivo')
  }

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge: Uint8Array.from(challenge, (c) => c.charCodeAt(0)),
    rp: {
      name: 'Collector Enterprise',
      id: window.location.hostname,
    },
    user: {
      id: Uint8Array.from(userId, (c) => c.charCodeAt(0)),
      name: userId,
      displayName: userId,
    },
    pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
    },
    timeout: 60000,
    attestation: 'direct',
  }

  try {
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })

    if (!credential || !(credential instanceof PublicKeyCredential)) {
      throw new Error('No se pudo crear la credencial biométrica')
    }

    return credential
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      throw new Error('Autenticación biométrica cancelada por el usuario')
    }
    if (error.name === 'NotSupportedError') {
      throw new Error('Autenticación biométrica no soportada')
    }
    throw error
  }
}

/**
 * Autenticar con credencial biométrica
 */
export const authenticateBiometric = async (
  challenge: string,
  credentialId: string,
): Promise<PublicKeyCredential> => {
  if (!window.PublicKeyCredential) {
    throw new Error('Autenticación biométrica no disponible en este dispositivo')
  }

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge: Uint8Array.from(challenge, (c) => c.charCodeAt(0)),
    allowCredentials: [
      {
        id: Uint8Array.from(credentialId, (c) => c.charCodeAt(0)),
        type: 'public-key',
        transports: ['internal'],
      },
    ],
    timeout: 60000,
    userVerification: 'required',
  }

  try {
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    })

    if (!assertion || !(assertion instanceof PublicKeyCredential)) {
      throw new Error('No se pudo autenticar con biométrica')
    }

    return assertion
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      throw new Error('Autenticación biométrica cancelada por el usuario')
    }
    throw error
  }
}

/**
 * Probar autenticación biométrica (para setup)
 */
export const testBiometric = async (): Promise<boolean> => {
  try {
    const available = await isBiometricAvailable()
    if (!available) {
      return false
    }

    // Intentar crear una credencial de prueba
    const testChallenge = 'test-challenge-' + Date.now()
    await registerBiometric('test-user', testChallenge)
    return true
  } catch (error) {
    console.error('Error probando autenticación biométrica:', error)
    return false
  }
}

