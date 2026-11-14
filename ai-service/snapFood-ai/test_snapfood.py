import json
from pathlib import Path

from PIL import Image

from models.snapfood.predictor import SnapFoodPredictor


TEST_DIR = Path("/test-images")
RESULTS_FILE = Path("snapfood_test_results.json")


predictor = SnapFoodPredictor()

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

results = []

for image_path in images:
    print("=" * 70)
    print(f"IMAGE: {image_path.name}")

    try:
        image = Image.open(image_path)

        result = predictor.predict(image)

        image_result = {
            "image": image_path.name,
            "model": result.model_name,
            "predictions": [
                {
                    "food": prediction.food,
                    "confidence": prediction.confidence,
                }
                for prediction in result.predictions
            ],
        }

        results.append(image_result)

        if not result.predictions:
            print("No prediction above threshold.")
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

with open(RESULTS_FILE, "w", encoding="utf-8") as file:
    json.dump(
        results,
        file,
        indent=2,
        ensure_ascii=False,
    )

print(f"Results saved to: {RESULTS_FILE}")