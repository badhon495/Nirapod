// Utility functions for handling API and image URLs

// Get the base URL for API requests (same as axios configuration)
export const getApiBaseUrl = () => {
  return process.env.NODE_ENV === 'production' 
    ? process.env.REACT_APP_API_BASE_URL || 'https://nirapod.onrender.com'
    : 'http://localhost:8080';
};

// Process image URL to ensure it works in both development and production
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // If it's already a full URL (e.g., Cloudinary), return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Clean the path - remove leading /uploads/ if present
  const cleanPath = imagePath.replace(/^\/uploads\//, '');
  
  // Build the full URL using the base URL
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/uploads/${cleanPath}`;
};

// Process multiple images for photo viewer
export const processPhotosForViewer = (photos) => {
  return photos.map(photo => {
    const imageUrl = getImageUrl(photo);
    return {
      primary: imageUrl,
      fallback: imageUrl.replace('/uploads/', '/') // Fallback without uploads prefix
    };
  });
};

export default {
  getApiBaseUrl,
  getImageUrl,
  processPhotosForViewer
};
