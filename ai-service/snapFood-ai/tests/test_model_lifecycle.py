import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import tensorflow as tf
from PIL import Image

from core import model_lifecycle
from core import model_registry


class ModelLifecycleTests(unittest.TestCase):
    def setUp(self):
        self.temp_directory = tempfile.TemporaryDirectory()
        self.config_directory = Path(self.temp_directory.name)
        self.active_path = self.config_directory / "active_model.json"

    def tearDown(self):
        self.temp_directory.cleanup()

    def test_active_model_defaults_to_snapfood(self):
        with patch.object(model_lifecycle, "ACTIVE_MODEL_PATH", self.active_path):
            self.assertEqual(model_lifecycle.get_active_model(), "snapfood")

    def test_active_model_is_persisted_and_validated(self):
        with patch.object(model_lifecycle, "ACTIVE_MODEL_PATH", self.active_path):
            model_lifecycle.CONFIG_DIR = self.config_directory
            self.assertEqual(
                model_lifecycle.set_active_model("9ja_food_lens"),
                "9ja_food_lens",
            )
            self.assertEqual(model_lifecycle.get_active_model(), "9ja_food_lens")

            with self.assertRaises(ValueError):
                model_lifecycle.set_active_model("not-a-model")

    def test_model_versions_can_be_listed_rolled_back_and_deleted(self):
        model_root = self.config_directory / "models"
        artifact_path = model_root / "snapfood" / "model" / "food_vision_model.keras"
        artifact_path.parent.mkdir(parents=True)
        artifact_path.write_bytes(b"previous-model")

        with patch.object(model_lifecycle, "MODEL_ROOT", model_root):
            previous_version_id = model_lifecycle._save_current_as_version("snapfood", artifact_path)
            artifact_path.write_bytes(b"replacement-model")
            versions = model_lifecycle.list_model_versions("snapfood")
            self.assertEqual(len(versions), 1)
            self.assertEqual(versions[0]["id"], previous_version_id)

            rollback_result = model_lifecycle.rollback_model("snapfood", versions[0]["id"])
            self.assertEqual(artifact_path.read_bytes(), b"previous-model")
            self.assertIsNotNone(rollback_result["previous_version_id"])

            model_lifecycle.delete_model_version("snapfood", versions[0]["id"])
            remaining_versions = model_lifecycle.list_model_versions("snapfood")
            self.assertEqual(len(remaining_versions), 1)
            remaining_version_path = (
                model_root
                / "snapfood"
                / "versions"
                / remaining_versions[0]["id"]
                / "food_vision_model.keras"
            )
            self.assertEqual(remaining_version_path.read_bytes(), b"replacement-model")

    def test_new_model_registration_publishes_compatible_registry_metadata(self):
        model_root = self.config_directory / "models"
        with (
            patch.object(model_lifecycle, "MODEL_ROOT", model_root),
            patch.object(model_registry, "MODEL_ROOT", model_root),
            patch.object(model_lifecycle, "CONFIG_DIR", self.config_directory),
            patch.object(model_lifecycle, "ACTIVE_MODEL_PATH", self.active_path),
            patch.object(model_lifecycle, "_validate_uploaded_artifact"),
        ):
            registered = model_lifecycle.register_model(
                model_name="suya-specialist",
                display_name="Suya Specialist",
                architecture="keras_classifier",
                labels=["suya", "kilishi"],
                filename="suya.keras",
                content=b"validated model bytes",
            )
            self.assertEqual(registered["classes"], 2)
            self.assertIn("suya-specialist", model_registry.list_models())
            self.assertEqual(model_registry.get_model_info("suya-specialist")["task"], "single-label")
            self.assertEqual(model_lifecycle.set_active_model("suya-specialist"), "suya-specialist")
            active_model = next(
                model for model in model_lifecycle.get_model_status()["models"] if model["active"]
            )
            self.assertEqual(active_model["name"], "suya-specialist")

            with self.assertRaisesRegex(ValueError, "already registered"):
                model_lifecycle.register_model(
                    model_name="suya-specialist",
                    display_name="Duplicate",
                    architecture="keras_classifier",
                    labels=["suya", "kilishi"],
                    filename="suya.keras",
                    content=b"model bytes",
                )

    def test_new_model_registration_rejects_duplicate_labels_before_writing(self):
        model_root = self.config_directory / "models"
        with patch.object(model_lifecycle, "MODEL_ROOT", model_root):
            with self.assertRaisesRegex(ValueError, "must be unique"):
                model_lifecycle.register_model(
                    model_name="invalid-model",
                    display_name="Invalid",
                    architecture="keras_classifier",
                    labels=["suya", "Suya"],
                    filename="model.keras",
                    content=b"model bytes",
                )
        self.assertFalse((model_root / "invalid-model").exists())

    def test_valid_keras_model_registers_and_predicts(self):
        model_root = self.config_directory / "models"
        artifact_path = self.config_directory / "source.keras"
        keras_model = tf.keras.Sequential([
            tf.keras.layers.Input(shape=(224, 224, 3)),
            tf.keras.layers.GlobalAveragePooling2D(),
            tf.keras.layers.Dense(2, activation="softmax"),
        ])
        keras_model.save(artifact_path)

        with (
            patch.object(model_lifecycle, "MODEL_ROOT", model_root),
            patch.object(model_registry, "MODEL_ROOT", model_root),
        ):
            model_lifecycle.register_model(
                model_name="runtime-smoke-model",
                display_name="Runtime Smoke Model",
                architecture="keras_classifier",
                labels=["food-a", "food-b"],
                filename="source.keras",
                content=artifact_path.read_bytes(),
            )
            predictor = model_registry.get_model("runtime-smoke-model")
            result = predictor.predict(Image.new("RGB", (224, 224)))

        self.assertEqual(result.model_name, "runtime-smoke-model")
        self.assertLessEqual(len(result.predictions), 1)


if __name__ == "__main__":
    unittest.main()
