import logging
import urllib.request
import io
import face_recognition
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

class FaceService:
    @staticmethod
    def load_image_from_file_or_url(image_source):
        """
        Loads an image from a URL, a file-like object, or a filepath.
        Returns a numpy array representing the image (RGB).
        """
        try:
            if isinstance(image_source, str) and (image_source.startswith("http://") or image_source.startswith("https://")):
                # Load image from URL
                with urllib.request.urlopen(image_source) as response:
                    image_data = response.read()
                pil_image = Image.open(io.BytesIO(image_data)).convert('RGB')
                return np.array(pil_image)
            
            elif hasattr(image_source, 'read'):
                # Load image from file-like object (e.g., InMemoryUploadedFile)
                image_source.seek(0)
                pil_image = Image.open(image_source).convert('RGB')
                return np.array(pil_image)
            
            else:
                # Load image from filepath
                return face_recognition.load_image_file(image_source)
        except Exception as e:
            logger.error(f"Failed to load image: {str(e)}")
            raise ValueError(f"Could not load image: {str(e)}")

    @classmethod
    def get_face_encoding(cls, image_source):
        """
        Extracts the first face encoding (128-dimensional list of floats) from the image.
        Returns None if no face is found.
        """
        try:
            image_array = cls.load_image_from_file_or_url(image_source)
            # Find face locations and encodings
            encodings = face_recognition.face_encodings(image_array)
            if not encodings:
                logger.warning("No faces detected in the provided image.")
                return None
            
            # Return the first face encoding as a list of standard Python floats
            return list(encodings[0].astype(float))
        except Exception as e:
            logger.error(f"Error extracting face encoding: {str(e)}")
            return None

    @staticmethod
    def verify_face(query_encoding, known_encodings_list, tolerance=0.5):
        """
        Compares a query face encoding against a list of known face encodings.
        known_encodings_list should be a list of lists/tuples representing the 128D floats.
        Returns a tuple: (match_index, confidence_score) or (None, 0.0) if no match.
        """
        if not query_encoding or not known_encodings_list:
            return None, 0.0

        try:
            # Convert list of lists to numpy arrays
            known_arrays = [np.array(enc) for enc in known_encodings_list]
            query_array = np.array(query_encoding)

            # Compare faces
            matches = face_recognition.compare_faces(known_arrays, query_array, tolerance=tolerance)
            
            if not any(matches):
                return None, 0.0

            # Calculate distances (smaller distance = higher confidence/match quality)
            distances = face_recognition.face_distance(known_arrays, query_array)
            
            best_match_index = int(np.argmin(distances))
            if matches[best_match_index]:
                # Confidence score can be formulated as (1 - distance) or similar
                # For standard tolerance 0.5, a distance of 0.3 is high confidence
                distance = distances[best_match_index]
                confidence_score = float(max(0.0, 1.0 - distance))
                return best_match_index, confidence_score
                
            return None, 0.0
        except Exception as e:
            logger.error(f"Error verifying face: {str(e)}")
            return None, 0.0
