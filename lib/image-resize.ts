/**
 * Client-side image resizing using Canvas API.
 * Ensures images are reasonably sized before uploading or sending to Gemini API.
 */

const MAX_DIMENSION = 1536
const JPEG_QUALITY = 0.85

/**
 * Resize an image file if it exceeds MAX_DIMENSION on either axis.
 * Converts to JPEG for consistent compression.
 * Returns the original file if it's already small enough and is JPEG.
 */
export async function resizeImageFile(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const { width, height } = img

      // If already within limits and is JPEG, return as-is
      if (
        width <= MAX_DIMENSION &&
        height <= MAX_DIMENSION &&
        file.type === 'image/jpeg'
      ) {
        resolve(file)
        return
      }

      // Calculate new dimensions maintaining aspect ratio
      let newWidth = width
      let newHeight = height

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          newWidth = MAX_DIMENSION
          newHeight = Math.round((height / width) * MAX_DIMENSION)
        } else {
          newHeight = MAX_DIMENSION
          newWidth = Math.round((width / height) * MAX_DIMENSION)
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = newWidth
      canvas.height = newHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }

      ctx.drawImage(img, 0, 0, newWidth, newHeight)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }

          const baseName = file.name.replace(/\.[^.]+$/, '')
          const resizedFile = new File([blob], `${baseName}.jpg`, {
            type: 'image/jpeg',
          })

          resolve(resizedFile)
        },
        'image/jpeg',
        JPEG_QUALITY
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image for resizing'))
    }

    img.src = url
  })
}

/**
 * Resize a Blob into a resized File.
 */
export async function resizeImageBlob(
  blob: Blob,
  filename: string
): Promise<File> {
  const file = new File([blob], filename, {
    type: blob.type || 'image/jpeg',
  })
  return resizeImageFile(file)
}

/**
 * Convert a File to a base64 string (without data URL prefix).
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove the data:...;base64, prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
