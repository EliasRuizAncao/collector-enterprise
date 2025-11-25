/**
 * Exportar componentes mobile
 */

export { default as CameraCapture } from './CameraCapture'
export type { CameraCaptureProps, CapturedPhoto } from './CameraCapture'

export { default as PhotoGallery } from './PhotoGallery'
export type { PhotoGalleryProps, Photo } from './PhotoGallery'

export { default as PhotoEditor } from './PhotoEditor'
export type { PhotoEditorProps } from './PhotoEditor'

export { default as SignaturePad } from './SignaturePad'
export type { SignaturePadProps, SignatureData } from './SignaturePad'

export { default as SignaturePreview } from './SignaturePreview'
export type { SignaturePreviewProps } from './SignaturePreview'

export { default as LocationPicker } from './LocationPicker'
export type { LocationPickerProps, LocationData } from './LocationPicker'

export { default as UpdatePrompt } from './UpdatePrompt'
export type { UpdatePromptProps } from './UpdatePrompt'

// Componentes offline
export * from './offline'

// Componentes empty state
export * from './empty'

