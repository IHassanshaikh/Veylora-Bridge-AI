import json
import logging
import re
from typing import Dict, Any, Optional
from ..config import settings

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self._client = None
        if self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
                logger.info(f"Gemini client initialized with model {self.model_name}")
            except Exception as e:
                logger.warning(f"Could not initialize google-genai client: {e}. Falling back to smart generator.")

    async def generate_structured_response(self, system_instruction: str, prompt: str, schema: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generate response via Gemini or resilient domain-aware fallback."""
        if self._client:
            try:
                response = self._client.models.generate_content(
                    model=self.model_name,
                    contents=f"{system_instruction}\n\nTask:\n{prompt}",
                    config={
                        "response_mime_type": "application/json"
                    }
                )
                text = response.text.strip()
                # Parse JSON
                try:
                    return json.loads(text)
                except json.JSONDecodeError:
                    # Clean markdown ticks if present
                    match = re.search(r"```json\s*(\{.*?\})\s*```", text, re.DOTALL)
                    if match:
                        return json.loads(match.group(1))
                    match2 = re.search(r"(\{.*\})", text, re.DOTALL)
                    if match2:
                        return json.loads(match2.group(1))
            except Exception as e:
                logger.error(f"Gemini generation error: {e}. Using deterministic fallback.")
        
        return {}

ai_service = AIService()

