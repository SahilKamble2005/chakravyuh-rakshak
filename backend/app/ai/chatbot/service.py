import json
from typing import AsyncGenerator
import os

DEMO_MODE = os.getenv("DEMO_MODE", "True").lower() in ("true", "1", "yes")

async def chat_stream(message: str, language: str) -> AsyncGenerator[str, None]:
    """Streaming chat response, handles tools and translation."""
    if DEMO_MODE:
        response = f"I am a simulated assistant. You said: {message} in {language}."
        words = response.split()
        for word in words:
            yield f"data: {json.dumps({'content': word + ' '})}\n\n"
            import asyncio
            await asyncio.sleep(0.05)
    else:
        # OpenAI or local LLM logic here
        yield f"data: {json.dumps({'content': 'Real LLM not configured.'})}\n\n"
