export interface ExpiryOption {
  label: string
  value: number
}

export const EXPIRY_OPTIONS: ExpiryOption[] = [
  { label: '1 Hour', value: 1000 * 60 * 60 },
  { label: '24 Hours', value: 1000 * 60 * 60 * 24 },
  { label: '3 Days', value: 1000 * 60 * 60 * 24 * 3 },
  { label: 'Permanent', value: 0 }
]
