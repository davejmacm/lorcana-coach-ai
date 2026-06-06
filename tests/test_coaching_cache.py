import unittest
from unittest.mock import patch, mock_open, MagicMock
import os
import json
import sys

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from server import is_coaching_payload_degraded

class TestCoachingCacheValidation(unittest.TestCase):

    def test_valid_payload_not_degraded(self):
        valid_payload = {
            "game_id": "test_game",
            "takeaways": "* Focus on early play\n* Efficient trading\n* Curve conservation",
            "mulligan_analysis": {
                "execution_rating": "Optimal",
                "coach_verdict": "Your decision to keep Minnie Mouse was excellent against their Amber curve."
            },
            "token_usage": {"prompt_tokens": 100, "candidates_tokens": 50, "total_tokens": 150}
        }
        self.assertFalse(is_coaching_payload_degraded(valid_payload))

    def test_empty_or_none_payload_is_degraded(self):
        self.assertTrue(is_coaching_payload_degraded(None))
        self.assertTrue(is_coaching_payload_degraded({}))

    def test_master_error_fallback_marker_is_degraded(self):
        fallback_payload = {
            "game_id": "test_game",
            "takeaways": "* Keep early board challenges\n* Plan ink well",
            "mulligan_analysis": {
                "execution_rating": "Optimal",
                "coach_verdict": "Decent curve keep."
            },
            "token_usage": {"note": "master error fallback used"}
        }
        self.assertTrue(is_coaching_payload_degraded(fallback_payload))

    def test_missing_verdict_is_degraded(self):
        payload_missing_verdict = {
            "game_id": "test_game",
            "takeaways": "* Play faster",
            "mulligan_analysis": {
                "execution_rating": "Optimal",
                "coach_verdict": "No verdict available."
            }
        }
        self.assertTrue(is_coaching_payload_degraded(payload_missing_verdict))

        payload_none_verdict = {
            "game_id": "test_game",
            "takeaways": "* Play faster",
            "mulligan_analysis": {
                "execution_rating": "Optimal",
                "coach_verdict": None
            }
        }
        self.assertTrue(is_coaching_payload_degraded(payload_none_verdict))

    def test_missing_takeaways_is_degraded(self):
        payload_missing_takeaways = {
            "game_id": "test_game",
            "takeaways": None,
            "mulligan_analysis": {
                "execution_rating": "Optimal",
                "coach_verdict": "Keep Minnie."
            }
        }
        self.assertTrue(is_coaching_payload_degraded(payload_missing_takeaways))

    def test_fallback_verdict_text_is_degraded(self):
        payload_with_fallback_text = {
            "game_id": "test_game",
            "takeaways": "* Focus on early curves",
            "mulligan_analysis": {
                "execution_rating": "Optimal",
                "coach_verdict": "You made reasonable mulligan decisions. Tossing high-cost cards was a good call, giving you early game interaction in this win."
            }
        }
        self.assertTrue(is_coaching_payload_degraded(payload_with_fallback_text))

    def test_missing_execution_rating_is_degraded(self):
        payload_missing_rating = {
            "game_id": "test_game",
            "takeaways": "* Focus on early curves",
            "mulligan_analysis": {
                "coach_verdict": "Keep Minnie."
            }
        }
        self.assertTrue(is_coaching_payload_degraded(payload_missing_rating))


if __name__ == "__main__":
    unittest.main()
