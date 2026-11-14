---
language: en
tags:
  - image-classification
  - multi-label-classification
  - nigerian-food
  - efficientnet
  - food-recognition
  - nutrimama
license: apache-2.0
---

# Nigerian Food Lens — Multi-Label Food Detector

Fine-tuned **EfficientNetV2-S** model for recognising Nigerian foods in photos.
Given a plate image it returns every food item visible along with a confidence score.

## Model Details

- **Architecture**: EfficientNetV2-S (torchvision), fine-tuned classifier head
- **Training**: Multi-label classification with weighted BCE loss
- **Input**: RGB image, resized to 384×384
- **Output**: Sigmoid probabilities per class — all items above threshold are returned
- **Threshold**: 0.3 (recommended)

## How to Use

### Python (direct)

```python
import torch
import torch.nn as nn
from torchvision import models, transforms
from torchvision.models import EfficientNet_V2_S_Weights
from huggingface_hub import hf_hub_download
from PIL import Image
import json

# Download model files
model_path = hf_hub_download("yusasif/Nigerian-food-Lens", "best_model.pth")
vocab_path = hf_hub_download("yusasif/Nigerian-food-Lens", "label_vocab.json")

# Load vocab
with open(vocab_path) as f:
    vocab = json.load(f)
labels = vocab["labels"]

# Load model
checkpoint = torch.load(model_path, map_location="cpu", weights_only=False)
m = models.efficientnet_v2_s(weights=None)
m.classifier = nn.Sequential(
    nn.Dropout(p=0.3, inplace=True),
    nn.Linear(m.classifier[1].in_features, len(labels)),
)
m.load_state_dict(checkpoint["model_state_dict"])
m.eval()

# Preprocess image
transform = transforms.Compose([
    transforms.Resize((384, 384)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])
image = Image.open("your_food_image.jpg").convert("RGB")
tensor = transform(image).unsqueeze(0)

# Predict
with torch.no_grad():
    probs = torch.sigmoid(m(tensor)).squeeze(0).numpy()

# Top 3 results
top3 = sorted(enumerate(probs), key=lambda x: x[1], reverse=True)[:3]
for idx, score in top3:
    print(f"{labels[idx]}: {score*100:.1f}%")
```

### REST API (Docker)

```bash
# Run the API server
docker compose up --build

# Send an image
curl -X POST http://localhost:8003/detect \
  -F "file=@plate.jpg"
```

Response:
```json
{
  "detected": [
    {"food": "Egusi soup", "confidence": 0.87},
    {"food": "Eba",        "confidence": 0.81},
    {"food": "Stockfish",  "confidence": 0.74}
  ]
}
```

## Detectable Foods (41 classes)

- Akara
- Akara And Bread
- Amala
- Banga soup
- Beans
- Beef
- Bitterleaf soup
- Bread
- Chicken
- Cow foot
- Cow skin
- Eba
- Edikaikong
- Efo Riro
- Egg
- Egusi soup
- Ewedu
- Fish
- Fufu
- Garri and Groundnut
- Gbegiri
- Iyan
- Jollof rice
- Moi Moi
- Nkwobi
- Ofe Oha
- Ofe Owerri
- Ogbono soup
- Ogi
- Ogi and Akara
- Okra soup
- Onion
- Plantain
- Rice
- Shrimp
- Snail
- Spaghetti
- Stew
- Stockfish
- Tomato
- Tripe

## Training Data

Trained on the NutriMama Nigerian food dataset — a multi-label annotated collection
of Yoruba, Igbo, and Hausa dishes covering swallows, soups, proteins, rice dishes,
snacks and street food.
