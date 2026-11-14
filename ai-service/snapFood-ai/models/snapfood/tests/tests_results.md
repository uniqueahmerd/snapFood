# SnapFood V1 — Model Test Results

## 1. Overview

This document records the integration and image-testing results for the original SnapFood V1 food classification model.

The model is currently retained as a development/benchmarking model while the newer Nigerian Food Lens model is evaluated.

---

## 2. Model Information

**Model name:** SnapFood V1

**Internal model name:**

```text
snapfood
```

**Framework:** TensorFlow / Keras

**Architecture:**

```text
EfficientNetB3
    ↓
GlobalAveragePooling2D
    ↓
Dense(128)
    ↓
Dropout
    ↓
Dense(10)
    ↓
Softmax
```

**Input shape:**

```text
224 × 224 × 3
```

**Output shape:**

```text
(None, 10)
```

**Output type:**

```text
Single-label classification
```

**Model file:**

```text
models/snapfood/model/food_vision_model.keras
```

---

## 3. Confirmed Label Mapping

The original SnapFood application contained the following class order:

```python
class_names = [
    "akara",
    "banga_soup",
    "egusi_soup",
    "jollof_rice",
    "moi_moi",
    "nkwobi",
    "okpa",
    "suya",
    "tuwo",
    "yam_porridge",
]
```

The model has exactly 10 output units.

The confirmed mapping is therefore:

| Output index | Food         |
| -----------: | ------------ |
|            0 | akara        |
|            1 | banga_soup   |
|            2 | egusi_soup   |
|            3 | jollof_rice  |
|            4 | moi_moi      |
|            5 | nkwobi       |
|            6 | okpa         |
|            7 | suya         |
|            8 | tuwo         |
|            9 | yam_porridge |

This mapping was verified against the original application code before the predictor was activated.

---

## 4. Predictor Integration

The model was isolated into:

```text
models/snapfood/
├── food_info.json
├── health_logic.py
├── inspect_model.py
├── labels.py
├── predictor.py
├── __init__.py
├── model/
│   └── food_vision_model.keras
└── tests/
    └── test_results.md
```

The predictor implements the common SnapFood AI interface:

```text
BasePredictor
    ↓
SnapFoodPredictor
```

The predictor returns the normalized internal structure:

```text
PredictionResult
    └── predictions[]
          ├── food
          └── confidence
```

Because SnapFood V1 is a softmax classifier, it returns a maximum of one food prediction.

---

## 5. Predictor Verification

The predictor was successfully loaded inside the Docker environment.

Verification result:

```text
Loading SnapFood V1...
SnapFood V1 ready! 10 classes loaded.

MODEL OUTPUT SHAPE: (None, 10)
LABEL COUNT: 10
PREDICTOR TEST PASSED
```

Status:

```text
PASS
```

---

## 6. Test Environment

The model was tested inside the SnapFood AI Docker container.

Environment:

```text
OS: Windows 11 Pro
Runtime: Docker
Python: 3.11
TensorFlow: 2.21.0
Execution device: CPU
GPU/CUDA: Not available
```

TensorFlow produced CUDA-related warnings because the environment does not have an available NVIDIA GPU.

These warnings did not prevent model loading or inference.

---

## 7. Test Dataset

The same 16 test images previously used for Nigerian Food Lens were used for SnapFood V1.

This allows both models to be evaluated against the same image set.

Test images:

```text
16
```

Confidence threshold:

```text
0.50
```

---

## 8. Test Results

|  # | Image                                         | Prediction   | Confidence |
| -: | --------------------------------------------- | ------------ | ---------: |
|  1 | IMG-20260201-WA0037.jpg                       | moi_moi      |     99.19% |
|  2 | IMG-20260201-WA0038.jpg                       | suya         |     99.68% |
|  3 | IMG-20260201-WA0040.jpg                       | moi_moi      |     67.82% |
|  4 | IMG-20260201-WA0041.jpg                       | moi_moi      |     98.02% |
|  5 | Jamaican-chicken-soup-and-tuwo-15-720x480.jpg | tuwo         |     98.96% |
|  6 | OIP-1582095491.cKxT8eI_rnEg1uifGKqfkwHaKR.jpg | suya         |     99.22% |
|  7 | OIP-161061871.Y3QeyP3xaQvxwCp7fwWqlgHaFj.jpg  | banga_soup   |     96.75% |
|  8 | OIP-1761869635.V2jVj8ymYtVvBw7j1AwL2wHaLH.jpg | moi_moi      |     99.19% |
|  9 | OIP-1935279311.IABiReHx0OcC3ZZkJUOHAwHaHa.jpg | yam_porridge |     98.59% |
| 10 | OIP-2317363927.lsLb1Wym8miNa5ZnB-Eq-QHaEK.jpg | okpa         |     98.78% |
| 11 | OIP-2849830401.x92sTRMrWexZu9CoGsus-wHaE8.jpg | nkwobi       |     99.91% |
| 12 | OIP-2853987663.liF7dN2RZ0hs9OWmiddJqQHaGz.jpg | akara        |     99.98% |
| 13 | OIP-287015347.PP6AYcS7JCbHg3hSU5dTNwHaJ4.jpg  | egusi_soup   |     99.17% |
| 14 | OIP-4046385151.RnjwG65lF5qCtLSJDhb_ngHaE8.jpg | egusi_soup   |     99.37% |
| 15 | jollof_rice_recipe1.webp                      | jollof_rice  |     99.15% |
| 16 | pexels-ash-craig-122861-376464.jpg            | akara        |     51.54% |

---

## 9. Test Observations

### High-confidence predictions

Several images produced very high confidence:

```text
Akara       99.98%
Nkwobi      99.91%
Moi Moi     99.19%
Egusi Soup  99.37%
Jollof Rice 99.15%
```

### Lower-confidence prediction

The lowest prediction was:

```text
Image: pexels-ash-craig-122861-376464.jpg
Prediction: akara
Confidence: 51.54%
```

This indicates relatively low confidence compared with most of the other test images.

### Single-label limitation

SnapFood V1 uses softmax classification and therefore selects one class.

For example, an image may contain a dish together with identifiable components, but SnapFood V1 returns only its highest-scoring class.

This differs from Nigerian Food Lens, which uses multi-label classification.

---

## 10. Comparison With Nigerian Food Lens

Both models were tested using the same 16 images.

The models have different output designs.

### SnapFood V1

```text
Image
  ↓
EfficientNetB3
  ↓
Softmax
  ↓
ONE predicted class
```

### Nigerian Food Lens

```text
Image
  ↓
EfficientNetV2-S
  ↓
Sigmoid
  ↓
MULTIPLE possible labels
```

Example:

For one Nkwobi image, Nigerian Food Lens detected:

```text
Nkwobi
Onion
Cow foot
```

while SnapFood V1 returned:

```text
Nkwobi
```

This demonstrates that the two models provide different types of information and should not be evaluated only by comparing their confidence percentages.

---

## 11. Important Benchmark Limitation

The 16 images are an engineering test set, not a formally labeled evaluation dataset.

Therefore:

* Confidence is not the same as accuracy.
* The results do not establish a formal model accuracy percentage.
* The images have not been independently labeled using a standardized evaluation protocol.
* Some images may contain multiple foods or food components.
* A larger, properly labeled Nigerian food dataset will be required for meaningful model evaluation.

The current results are therefore used primarily to verify:

1. Model loading.
2. Image preprocessing.
3. Inference.
4. Label mapping.
5. Predictor integration.
6. Behavioral differences between models.

---

## 12. Integration Status

```text
Model file available              PASS
Model loads in Docker             PASS
10 output classes confirmed       PASS
Label mapping confirmed           PASS
Predictor implemented             PASS
Common BasePredictor interface    PASS
16-image inference test           PASS
Results documented                PASS
```

Overall SnapFood V1 integration status:

```text
PASS
```

---

## 13. Current Architecture

The AI service currently contains two development models:

```text
Model Registry
│
├── 9ja Food Lens
│   ├── PyTorch
│   ├── EfficientNetV2-S
│   ├── 41 classes
│   └── Multi-label
│
└── SnapFood V1
    ├── TensorFlow/Keras
    ├── EfficientNetB3
    ├── 10 classes
    └── Single-label
```

Both models implement the common:

```text
BasePredictor
```

and return:

```text
PredictionResult
```

This allows the rest of the application to remain independent of the underlying ML framework.

---

## 14. Current Engineering Decision

Both models will remain available during development for benchmarking and experimentation.

This does **not** represent a decision to maintain two permanent production models.

The longer-term direction remains:

```text
Current development
       ↓
Benchmark existing models
       ↓
Collect/evaluate Nigerian food data
       ↓
Train SnapFood Nigerian V2
       ↓
Evaluate V2 against existing models
       ↓
Make V2 the primary model when sufficiently validated
```

---

## 15. Next Engineering Step

The next step is to activate both predictors in the model registry:

```text
core/model_registry.py

9ja Food Lens
      +
SnapFood V1
```

After registration, both models should be loadable through the same interface:

```python
get_model("9ja_food_lens")
get_model("snapfood")
```

Only after registry verification should the analysis service be connected to the model layer.

---

## 16. Test Date

```text
2026-09-29
```
