# 9ja Food Lens — Model Test Results

## 1. Test Overview

**Project:** SnapFood AI
**Model:** Nigerian Food Lens
**Model ID:** `9ja_food_lens`
**Architecture:** EfficientNetV2-S
**Framework:** PyTorch / torchvision
**Model type:** Multi-label food classification
**Input:** RGB image, resized to `384 × 384`
**Output:** Sigmoid probability for each of 41 food classes
**Current confidence threshold:** `0.30`
**Runtime:** Docker
**Python:** 3.11
**Device:** CPU

---

## 2. Purpose of the Test

The purpose of this test was to verify that the Nigerian Food Lens model is correctly integrated into the SnapFood AI architecture.

The test verifies:

* Model weights load successfully.
* The 41-class vocabulary loads successfully.
* EfficientNetV2-S architecture matches the saved checkpoint.
* Image preprocessing works.
* Model inference works.
* Multi-label predictions are generated.
* Confidence scores are returned correctly.
* The common `BasePredictor` interface works.
* `PredictionResult` is returned successfully.
* The model can process multiple real food images inside Docker.

---

## 3. Model Files

The model is stored at:

```text
models/9ja_food_lens/model/
├── best_model.pth
└── label_vocab.json
```

The model contains **41 food classes**.

The predictor is located at:

```text
models/9ja_food_lens/predictor.py
```

---

## 4. Architecture Integration

The model follows the common SnapFood predictor interface:

```text
BasePredictor
      │
      ▼
NigerianFoodLensPredictor
      │
      ▼
predict(image)
      │
      ▼
PredictionResult
```

This allows the model to be used by the future model registry without exposing model-specific implementation details to `app.py`.

---

## 5. Test Environment

The test was executed using Docker.

The project was mounted into the container:

```text
/app
```

The local test-image directory was mounted into:

```text
/test-images
```

The model was loaded entirely inside the Docker container.

No model files were downloaded during the test.

---

## 6. Test Dataset

A local test folder containing **16 food images** was used.

The images included examples of:

* Moi Moi
* Nkwobi
* Akara
* Egusi soup
* Eba
* Fufu
* Jollof rice
* Chicken
* Tuwo
* Other Nigerian food/components

The images were not copied into the project or Docker image. They were mounted temporarily into the container for testing.

---

# 7. Test Results

## Image 1

**File:**

```text
IMG-20260201-WA0037.jpg
```

Predictions:

```text
Moi Moi — 98.34%
```

---

## Image 2

**File:**

```text
IMG-20260201-WA0038.jpg
```

Predictions:

```text
Onion — 99.50%
Tomato — 95.96%
Beef — 47.76%
Nkwobi — 42.58%
Cow foot — 39.94%
```

Observation:

The model detected both visible ingredients/components and a possible dish category.

---

## Image 3

**File:**

```text
IMG-20260201-WA0040.jpg
```

Predictions:

```text
Moi Moi — 99.29%
Egg — 37.17%
```

---

## Image 4

**File:**

```text
IMG-20260201-WA0041.jpg
```

Predictions:

```text
Moi Moi — 94.59%
Egg — 79.27%
Amala — 40.51%
Stew — 37.47%
```

---

## Image 5

**File:**

```text
Jamaican-chicken-soup-and-tuwo-15-720x480.jpg
```

Predictions:

```text
Egusi soup — 85.59%
Eba — 56.29%
```

Observation:

The image name suggests chicken soup and tuwo, while the model predicted Egusi soup and Eba. This should be treated as a potentially incorrect or ambiguous prediction and is useful for future evaluation.

---

## Image 6

**File:**

```text
OIP-1582095491.cKxT8eI_rnEg1uifGKqfkwHaKR.jpg
```

Predictions:

```text
Onion — 99.31%
Tomato — 97.34%
Beef — 56.89%
```

---

## Image 7

**File:**

```text
OIP-161061871.Y3QeyP3xaQvxwCp7fwWqlgHaFj.jpg
```

Predictions:

```text
Beef — 97.66%
Stockfish — 93.99%
Banga soup — 53.85%
Egusi soup — 40.85%
Ogbono soup — 33.45%
```

Observation:

The model demonstrates strong multi-label behavior but produces several possible dish/component predictions. Additional post-processing will be required before predictions are passed to nutrition and health analysis.

---

## Image 8

**File:**

```text
OIP-1761869635.V2jVj8ymYtVvBw7j1AwL2wHaLH.jpg
```

Predictions:

```text
Moi Moi — 98.34%
```

---

## Image 9

**File:**

```text
OIP-1935279311.IABiReHx0OcC3ZZkJUOHAwHaHa.jpg
```

Predictions:

```text
Egusi soup — 64.59%
Beef — 51.86%
Egg — 47.63%
Fufu — 33.61%
```

---

## Image 10

**File:**

```text
OIP-2317363927.lsLb1Wym8miNa5ZnB-Eq-QHaEK.jpg
```

Predictions:

```text
Moi Moi — 84.84%
```

---

## Image 11

**File:**

```text
OIP-2849830401.x92sTRMrWexZu9CoGsus-wHaE8.jpg
```

Predictions:

```text
Nkwobi — 99.31%
Onion — 98.29%
Cow foot — 97.21%
```

Observation:

This is a good example of multi-label detection where the model identifies both the dish and visible components.

---

## Image 12

**File:**

```text
OIP-2853987663.liF7dN2RZ0hs9OWmiddJqQHaGz.jpg
```

Predictions:

```text
Akara — 95.30%
Ogi and Akara — 78.24%
```

Observation:

The model identifies both a specific food and a combined food category. This may require normalization in the future nutrition layer to avoid double-counting.

---

## Image 13

**File:**

```text
OIP-287015347.PP6AYcS7JCbHg3hSU5dTNwHaJ4.jpg
```

Predictions:

```text
Egusi soup — 99.88%
Beef — 74.93%
Fufu — 52.79%
Iyan — 48.66%
Shrimp — 45.79%
Stockfish — 40.38%
```

Observation:

The model produces a strong primary food prediction along with multiple possible components.

---

## Image 14

**File:**

```text
OIP-4046385151.RnjwG65lF5qCtLSJDhb_ngHaE8.jpg
```

Predictions:

```text
Egusi soup — 99.28%
Fufu — 94.68%
```

---

## Image 15

**File:**

```text
jollof_rice_recipe1.webp
```

Predictions:

```text
Jollof rice — 99.38%
Chicken — 69.38%
```

---

## Image 16

**File:**

```text
pexels-ash-craig-122861-376464.jpg
```

Predictions:

```text
Egg — 49.79%
Bread — 33.27%
Moi Moi — 30.93%
```

Observation:

The predictions are relatively low-confidence and should be considered uncertain.

---

# 8. Overall Observations

### Model loading

**Status: PASS**

The model successfully loaded:

```text
EfficientNetV2-S
41 classes
best_model.pth
label_vocab.json
```

---

### Image preprocessing

**Status: PASS**

Images were successfully converted to RGB and resized to:

```text
384 × 384
```

with ImageNet normalization.

---

### Inference

**Status: PASS**

The model successfully generated predictions for all 16 test images.

---

### Multi-label prediction

**Status: PASS**

The model successfully returned multiple predictions when several food/component classes passed the confidence threshold.

---

### Common predictor interface

**Status: PASS**

The model successfully works through:

```text
BasePredictor
```

and returns:

```text
PredictionResult
```

---

# 9. Important Findings

## Finding 1 — Strong predictions exist

Several images produced very high-confidence predictions, including:

```text
Moi Moi      99.29%
Nkwobi       99.31%
Akara        95.30%
Egusi soup   99.88%
Jollof rice  99.38%
```

These demonstrate that the model can produce strong classifications on several tested food images.

---

## Finding 2 — Multi-label output needs interpretation

The model can return both dishes and components.

Example:

```text
Nkwobi
Onion
Cow foot
```

or:

```text
Egusi soup
Beef
Fufu
Iyan
Shrimp
Stockfish
```

Therefore, the prediction layer should not directly assume that every returned label represents a separate complete meal.

A future analysis layer must interpret and normalize these predictions.

---

## Finding 3 — Potential duplicate/overlapping labels

Example:

```text
Akara — 95.30%
Ogi and Akara — 78.24%
```

These labels can represent overlapping concepts.

The nutrition system must avoid double-counting them.

---

## Finding 4 — Some predictions may be incorrect

The model can produce confident predictions that may not match the actual food represented by an image.

Example:

```text
Jamaican-chicken-soup-and-tuwo image

Model:
Egusi soup — 85.59%
Eba — 56.29%
```

This confirms that confidence alone should not be treated as guaranteed correctness.

---

# 10. Current Decision

The model is considered **successfully integrated and operational as the SnapFood V1 foundation model**.

It will not be treated as the final permanent SnapFood model.

The long-term plan remains:

```text
SnapFood V1
9ja Food Lens
      ↓
Temporary production/foundation model

SnapFood V2
Our own Nigerian food model
      ↓
Future primary model
```

The architecture will allow the two models to coexist during development and benchmarking without permanently maintaining two production models.

---

# 11. Current Architecture

```text
                    FastAPI
                       │
                       ▼
                Model Registry
                       │
                       ▼
                BasePredictor
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
     9ja Food Lens  SnapFood V1   SnapFood V2
      Predictor      Predictor     Predictor
          │            │            │
          ▼            ▼            ▼
        .pth          .keras       Future model
          │
          ▼
   PredictionResult
          │
          ▼
   Analysis Services
          │
     ┌────┴─────┐
     ▼          ▼
 Nutrition   Health Logic
```

---

# 12. Next Engineering Step

The next planned component is:

```text
core/model_registry.py
```

The model registry will provide a central way to select and load models without making `app.py` responsible for model-specific imports.

Before moving to the API layer, the registry should support:

* `9ja_food_lens`
* future `snapfood`
* future `snapfood_nigerian`
* additional models later

---

## Test Status

**Overall integration status: PASS**

The Nigerian Food Lens model is successfully loaded, executed, and returning normalized predictions through the common predictor interface.

**Date of test:** 2026-09-29
**Number of images tested:** 16
**Model threshold:** 0.30
**Environment:** Docker / CPU
