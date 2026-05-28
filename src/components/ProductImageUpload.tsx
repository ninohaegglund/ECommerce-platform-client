import { useEffect, useState } from 'react'
import type { ProductImage } from '../types/product-image'
import { createProductImage, getProductImages } from '../services/productImagesApi'

type ProductImageUploadProps = {
  productId: string
}

const isValidHttpUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function ProductImageUpload({ productId }: ProductImageUploadProps) {
  const [images, setImages] = useState<ProductImage[]>([])
  const [brokenImageIds, setBrokenImageIds] = useState<string[]>([])
  const [imageUrl, setImageUrl] = useState('')
  const [altText, setAltText] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [isPrimary, setIsPrimary] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [previewError, setPreviewError] = useState('')

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

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    setSuccess('')
    setPreviewError('')
    setImageUrl(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedImageUrl = imageUrl.trim()

    if (!trimmedImageUrl) {
      setError('Please enter an image URL.')
      return
    }

    if (!isValidHttpUrl(trimmedImageUrl)) {
      setError('Image URL must be a valid http or https address.')
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

      const newImage = await createProductImage(productId, {
        imageUrl: trimmedImageUrl,
        altText: altText.trim() || undefined,
        sortOrder: sortOrderNum,
        isPrimary,
      })

      setImages((prev) => [...prev, newImage])
      setSuccess('Image added successfully!')

      // Reset form
      setImageUrl('')
      setAltText('')
      setSortOrder('0')
      setIsPrimary(false)
      setPreviewError('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add image.'
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

  const trimmedImageUrl = imageUrl.trim()
  const canPreview = isValidHttpUrl(trimmedImageUrl)

  return (
    <div className="product-image-upload">
      <h3>Product Images</h3>

      {error && <p className="feedback error">{error}</p>}
      {success && <p className="feedback success">{success}</p>}

      <form onSubmit={(e) => void handleSubmit(e)} className="image-upload-form">
        <label>
          Image URL *
          <input
            type="url"
            value={imageUrl}
            onChange={handleImageUrlChange}
            disabled={isLoading}
            placeholder="https://cdn.example.com/products/image.jpg"
          />
        </label>

        {canPreview && (
          <div className="image-preview">
            <img
              src={trimmedImageUrl}
              alt={altText.trim() || 'Preview'}
              onError={() => setPreviewError('Unable to load preview. Check the image URL.')}
              onLoad={() => setPreviewError('')}
            />
            <p className="preview-label">Preview</p>
            {previewError && <p className="feedback error">{previewError}</p>}
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
          disabled={isLoading || !trimmedImageUrl}
        >
          {isLoading ? 'Saving...' : 'Add Image'}
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
