/**
 * Cloudinary Upload Utility for React Native
 *
 * This utility handles document uploads from React Native to Cloudinary
 */

interface CloudinaryUploadResult {
  url: string
  publicId: string
  success: boolean
  error?: string
}

export async function uploadToCloudinary(
  fileUri: string,
  documentType: string,
  userId: string
): Promise<CloudinaryUploadResult> {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY

    if (!cloudName || !apiKey) {
      throw new Error('Cloudinary credentials not configured')
    }

    // Generate timestamp for signature
    const timestamp = Math.floor(Date.now() / 1000)

    // Generate unique public_id
    const publicId = `${userId}_${documentType}_${timestamp}`
    const folder = 'nogada-documents'

    // Create form data
    const formData = new FormData()

    // For React Native, we need to handle the file differently
    const filename = fileUri.split('/').pop() || 'document'
    const fileType = filename.split('.').pop()

    const file = {
      uri: fileUri,
      type: `image/${fileType}`, // or application/pdf for PDFs
      name: filename,
    } as any

    formData.append('file', file)
    formData.append('upload_preset', 'nogada-documents')
    formData.append('folder', folder)
    formData.append('public_id', publicId)
    formData.append('api_key', apiKey)
    formData.append('timestamp', timestamp.toString())

    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      success: true,
      url: data.secure_url,
      publicId: data.public_id,
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    return {
      success: false,
      url: '',
      publicId: '',
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

/**
 * Get file type from URI
 */
export function getFileTypeFromUri(uri: string): string {
  const extension = uri.split('.').pop()?.toLowerCase()

  if (extension === 'pdf') return 'application/pdf'
  if (['jpg', 'jpeg'].includes(extension || '')) return 'image/jpeg'
  if (extension === 'png') return 'image/png'

  return 'application/octet-stream'
}

/**
 * Validate file size (max 5MB)
 */
export function validateFileSize(size: number): boolean {
  const maxSize = 5 * 1024 * 1024 // 5MB in bytes
  return size <= maxSize
}

/**
 * Validate file type
 */
export function validateFileType(type: string): boolean {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  return allowedTypes.includes(type)
}
