import base64
import binascii
import io

from PIL import Image, UnidentifiedImageError


MAX_IMAGE_SIZE = 10 * 1024 * 1024


def decode_base64_image(base64_image: str) -> Image.Image:
    if not base64_image:
        raise ValueError("Image is required")

    if "," in base64_image:
        base64_image = base64_image.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(
            base64_image,
            validate=True,
        )
    except (binascii.Error, ValueError) as error:
        raise ValueError("Invalid base64 image") from error

    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise ValueError(
            "Image is too large. Maximum size is 10 MB."
        )

    try:
        image = Image.open(
            io.BytesIO(image_bytes)
        )
        image.load()
    except UnidentifiedImageError as error:
        raise ValueError(
            "Uploaded data is not a valid image"
        ) from error

    return image.convert("RGB")