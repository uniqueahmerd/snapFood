import importlib
from pathlib import Path

from PIL import Image


TEST_DIR = Path("/test-images")


module = importlib.import_module(
    "models.9ja_food_lens.predictor"
)

predictor = module.NigerianFoodLensPredictor()


image_extensions = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}


images = sorted(
    image
    for image in TEST_DIR.iterdir()
    if image.suffix.lower() in image_extensions
)


print(f"\nFound {len(images)} test images.\n")


for image_path in images:
    print("=" * 70)
    print(f"IMAGE: {image_path.name}")

    try:
        image = Image.open(image_path)

        result = predictor.predict(image)

        if not result.predictions:
            print("No predictions above threshold.")
        else:
            for prediction in result.predictions:
                print(
                    f"- {prediction.food}: "
                    f"{prediction.confidence:.2%}"
                )

    except Exception as error:
        print(f"ERROR: {error}")


print("\n" + "=" * 70)
print("TEST COMPLETE")