import aiohttp
import json
import logging
import os
from typing import Dict, Any, Optional
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

class OllamaClient:
    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        # Load environment variables
        load_dotenv()

        self.base_url = base_url or os.getenv('OLLAMA_URL', 'http://localhost:11434')
        self.model = model or os.getenv('OLLAMA_MODEL', 'llama3.2')
        self.session: Optional[aiohttp.ClientSession] = None

        logger.info(f"Ollama client initialized: {self.base_url} with model {self.model}")

    async def __aenter__(self):
        await self.connect()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.disconnect()

    async def connect(self):
        """Initialize HTTP session."""
        if not self.session:
            self.session = aiohttp.ClientSession()
            logger.info("Connected to Ollama server")

    async def disconnect(self):
        """Close HTTP session."""
        if self.session:
            await self.session.close()
            self.session = None
            logger.info("Disconnected from Ollama server")

    async def generate(self, prompt: str, **kwargs) -> str:
        """Generate text using Ollama."""
        if not self.session:
            await self.connect()

        url = f"{self.base_url}/api/generate"

        data = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            **kwargs
        }

        try:
            async with self.session.post(url, json=data) as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get('response', '')
                else:
                    error_text = await response.text()
                    logger.error(f"Ollama API error: {response.status} - {error_text}")
                    raise Exception(f"Ollama API error: {response.status}")

        except aiohttp.ClientError as e:
            logger.error(f"Network error connecting to Ollama: {e}")
            raise Exception(f"Failed to connect to Ollama server: {e}")

    async def chat(self, messages: list, **kwargs) -> str:
        """Chat with Ollama using conversation format."""
        if not self.session:
            await self.connect()

        url = f"{self.base_url}/api/chat"

        data = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            **kwargs
        }

        try:
            async with self.session.post(url, json=data) as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get('message', {}).get('content', '')
                else:
                    error_text = await response.text()
                    logger.error(f"Ollama chat API error: {response.status} - {error_text}")
                    raise Exception(f"Ollama chat API error: {response.status}")

        except aiohttp.ClientError as e:
            logger.error(f"Network error in chat: {e}")
            raise Exception(f"Failed to connect to Ollama server: {e}")

    async def list_models(self) -> list:
        """List available models."""
        if not self.session:
            await self.connect()

        url = f"{self.base_url}/api/tags"

        try:
            async with self.session.get(url) as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get('models', [])
                else:
                    logger.error(f"Failed to list models: {response.status}")
                    return []

        except aiohttp.ClientError as e:
            logger.error(f"Network error listing models: {e}")
            return []

    async def check_health(self) -> bool:
        """Check if Ollama server is healthy."""
        try:
            models = await self.list_models()
            return len(models) > 0
        except Exception:
            return False