---
title: SnapFood Ai
emoji: ⚡
colorFrom: indigo
colorTo: gray
sdk: docker
pinned: false
---

Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference

For admin monitoring and model registration, set `AI_ADMIN_TOKEN` in the AI service environment to the same high-entropy value configured for the backend. The `/models/status`, `/admin/logs`, and `/models/register` endpoints reject requests unless this service token is present and valid. Start the container with `-e AI_ADMIN_TOKEN=<same-secret-as-backend>`; do not commit the secret. If these endpoints return 404, rebuild and restart the AI service using this app's Dockerfile so the deployed image includes the routes. New model artifacts must be Keras `.keras` classifiers or EfficientNetV2-S multilabel `.pth` checkpoints, with labels matching the output count. Uploaded model files are validated and no uploaded Python code is executed.


docker run --rm -v "${PWD}:/app" snapfood-ai python -c "import tensorflow as tf; m=tf.keras.models.load_model('models/snapfood/model/food_vision_model.keras'); print('OUTPUT SHAPE:', m.output_shape); print('MODEL TEST PASSED')"