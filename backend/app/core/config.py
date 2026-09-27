from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional, Union
from pydantic import field_validator

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:5353c4e128f04a4c9edf7bd825cae022@localhost:5432/chakravyuh_rakshak"
    DATABASE_SYNC_URL: Optional[str] = "postgresql://postgres:5353c4e128f04a4c9edf7bd825cae022@localhost:5432/chakravyuh_rakshak"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "chakravyuh_rakshak_secret_key_8f73a9c82d4b1e60a34f8912c76e5d4a"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440
    
    BLOCKCHAIN_RPC_URL: str = "http://127.0.0.1:8545"
    BLOCKCHAIN_PRIVATE_KEY: Optional[str] = ""
    CONTRACT_ADDRESS: Optional[str] = ""
    CHAIN_ID: int = 31337
    
    SMS_API_KEY: Optional[str] = ""
    SMS_AUTH_TOKEN: Optional[str] = ""
    SMS_FROM_NUMBER: Optional[str] = ""
    FCM_PRIVATE_KEY: Optional[str] = ""
    
    OPENAI_API_KEY: Optional[str] = ""
    NOMINATIM_URL: str = "https://nominatim.openstreetmap.org"
    
    DEMO_MODE: bool = True
    CORS_ORIGINS: Union[List[str], str] = ["*"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                return json.loads(v)
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
