import logging
import cloudinary
import cloudinary.uploader
from django.conf import settings

logger = logging.getLogger(__name__)

# Configure Cloudinary credentials
cloudinary.config(
    cloud_name=settings.CLOUDINARY_STORAGE.get('CLOUD_NAME'),
    api_key=settings.CLOUDINARY_STORAGE.get('API_KEY'),
    api_secret=settings.CLOUDINARY_STORAGE.get('API_SECRET'),
    secure=True
)

class CloudinaryService:
    @staticmethod
    def upload_image(file_to_upload, folder="campus_vision/faces"):
        """
        Uploads an image file to Cloudinary.
        Returns a dictionary with 'url' and 'public_id'.
        """
        try:
            response = cloudinary.uploader.upload(
                file_to_upload,
                folder=folder,
                overwrite=True,
                resource_type="image"
            )
            return {
                "url": response.get("secure_url"),
                "public_id": response.get("public_id")
            }
        except Exception as e:
            logger.error(f"Failed to upload image to Cloudinary: {str(e)}")
            raise e

    @staticmethod
    def delete_image(public_id):
        """
        Deletes an image from Cloudinary by its public ID.
        """
        if not public_id:
            return None
        try:
            response = cloudinary.uploader.destroy(public_id)
            return response
        except Exception as e:
            logger.error(f"Failed to delete image {public_id} from Cloudinary: {str(e)}")
            return None
