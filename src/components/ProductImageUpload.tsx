import { useEffect, useRef, useState } from 'react'
import type { ProductImage } from '../types/product-image'
import { uploadProductImage, getProductImages } from '../services/productImagesApi'

type ProductImageUploadProps = {
  productId: string
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

function ProductImageUpload({ productId }: ProductImageUploadProps) {
  const [images, setImages] = useState<ProductImage[]>([])
  const [brokenImageIds, setBrokenImageIds] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [altText, setAltText] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [isPrimary, setIsPrimary] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load existing images
  useEffect(() => {
    const loadImages = async () => {
      setIsLoadingImages(true)
      try {
        const loadedImages = await getProductImages(productId)
        setImages(loadedImages)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load product images'
        setError(message)
      } finally {
        setIsLoadingImages(false)
      }
    }

    void loadImages()
  }, [productId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    setError('')
    setPreview(null)

    if (!selectedFile) {
      setFile(null)
      return
    }

    // Validation
    if (!ALLOWED_IMAGE_TYPES.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.')
      setFile(null)
      return
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size is 5MB.')
      setFile(null)
      return
    }

    setFile(selectedFile)

    // Create preview
    const reader = new FileReader()
    reader.onload = (event) => {
      setPreview(event.target?.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError('Please select an image file.')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const sortOrderNum = Number(sortOrder)
      if (!Number.isFinite(sortOrderNum) || sortOrderNum < 0) {
        throw new Error('Sort order must be a non-negative number.')
      }

      const newImage = await uploadProductImage(productId, {
        file,
        altText: altText || undefined,
        sortOrder: sortOrderNum,
        isPrimary,
      })

      setImages((prev) => [...prev, newImage])
      setSuccess('Image uploaded successfully!')

      // Reset form
      setFile(null)
      setAltText('')
      setSortOrder('0')
      setIsPrimary(false)
      setPreview(null)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload image.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageError = (imageId: string) => {
    setBrokenImageIds((current) =>
      current.includes(imageId) ? current : [...current, imageId],
    )
  }

  const visibleImages = images.filter(
    (image) => image.imageUrl.trim().length > 0 && !brokenImageIds.includes(image.id),
  )

  return (
    <div className="product-image-upload">
      <h3>Product Images</h3>

      {error && <p className="feedback error">{error}</p>}
      {success && <p className="feedback success">{success}</p>}

      <form onSubmit={(e) => void handleSubmit(e)} className="image-upload-form">
        <label>
          Image File *
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif"
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </label>

        {preview && (
          <div className="image-preview">
            <img src={preview} alt="Preview" />
            <p className="preview-label">Preview</p>
          </div>
        )}

        <label>
          Alt Text (optional)
          <input
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            disabled={isLoading}
            placeholder="Descriptive alt text for accessibility"
          />
        </label>

        <label>
          Sort Order
          <input
            type="number"
            min="0"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            disabled={isLoading}
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            disabled={isLoading}
          />
          Set as Primary Image
        </label>

        <button
          type="submit"
          className="submit-btn"
          disabled={isLoading || !file}
        >
          {isLoading ? 'Uploading...' : 'Upload Image'}
        </button>
      </form>

      <div className="image-list">
        <h4>Current Images</h4>
        {isLoadingImages ? (
          <p>Loading images...</p>
        ) : visibleImages.length === 0 ? (
          <p className="subtitle">No images uploaded yet.</p>
        ) : (
          <ul className="images-gallery">
            {visibleImages.map((image) => (
              <li key={image.id} className="image-item">
                <img
                  src={image.imageUrl}
                  alt={image.altText || 'Product image'}
                  onError={() => handleImageError(image.id)}
                />
                <div className="image-info">
                  {image.isPrimary && <span className="badge">Primary</span>}
                  <p className="image-order">Order: {image.sortOrder}</p>
                  {image.altText && <p className="image-alt">{image.altText}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default ProductImageUpload
