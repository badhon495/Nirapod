# Cloudinary Integration Setup Instructions

## Steps to Complete Cloudinary Integration:

### 1. Create a Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com) and sign up for a free account
2. After signup, you'll get your Cloud Name, API Key, and API Secret from the dashboard

### 2. Update application.properties
Replace the placeholder values in `/backend/src/main/resources/application.properties`:

```properties
# Replace these with your actual Cloudinary credentials
cloudinary.cloud-name=your_actual_cloud_name
cloudinary.api-key=your_actual_api_key
cloudinary.api-secret=your_actual_api_secret
```

### 3. Build and Run the Backend
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### 4. Test the Integration
- Try uploading images through signup, profile update, or complaint creation
- Images should now be stored on Cloudinary instead of local storage
- URLs will be in the format: `https://res.cloudinary.com/your_cloud_name/...`

## Folder Structure on Cloudinary:
- `nirapod/user-photos/` - User profile photos
- `nirapod/user-documents/` - User documents (NID, passport, utility bills, etc.)
- `nirapod/complaint-photos/` - Initial complaint photos
- `nirapod/complaint-uploads/` - Photos uploaded after complaint creation

## Benefits:
✅ Images are automatically stored in the cloud
✅ CDN delivery for fast loading worldwide
✅ Automatic image optimization and resizing
✅ No storage limitations on deployed platforms
✅ Images persist across deployments

## Verification:
1. Check your Cloudinary dashboard to see uploaded images
2. Verify that image URLs in your database start with `https://res.cloudinary.com/`
3. Test image loading in both development and production environments

## Note:
The code includes fallback logic to handle both Cloudinary URLs and old localhost URLs for backward compatibility.
