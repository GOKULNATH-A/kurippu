import os
import aiofiles
import logging
from abc import ABC, abstractmethod
from typing import Optional, Tuple
from app.config import settings

logger = logging.getLogger(__name__)


class StorageProvider(ABC):
    @abstractmethod
    async def save(self, file_content: bytes, filename: str, user_id: str) -> str:
        """Save file content and return storage key or relative path."""
        ...

    @abstractmethod
    async def get_path_or_url(self, storage_path: str) -> str:
        """Return public URL or local file path for viewing."""
        ...

    @abstractmethod
    async def delete(self, storage_path: str) -> bool:
        """Delete file from storage."""
        ...


class LocalStorageProvider(StorageProvider):
    def __init__(self, base_dir: str = settings.STORAGE_PATH):
        self.base_dir = os.path.abspath(base_dir)
        os.makedirs(self.base_dir, exist_ok=True)

    async def save(self, file_content: bytes, filename: str, user_id: str) -> str:
        user_dir = os.path.join(self.base_dir, user_id)
        os.makedirs(user_dir, exist_ok=True)
        file_path = os.path.join(user_dir, filename)
        
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(file_content)
            
        # Return relative path
        rel_path = os.path.join(user_id, filename).replace("\\", "/")
        return rel_path

    async def get_path_or_url(self, storage_path: str) -> str:
        clean_path = storage_path.replace("\\", "/")
        full_path = os.path.join(self.base_dir, clean_path)
        return full_path

    async def delete(self, storage_path: str) -> bool:
        try:
            clean_path = storage_path.replace("\\", "/")
            full_path = os.path.join(self.base_dir, clean_path)
            if os.path.exists(full_path):
                os.remove(full_path)
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting file from local storage: {e}")
            return False


class SupabaseStorageProvider(StorageProvider):
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        self.service_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        self.bucket = settings.SUPABASE_STORAGE_BUCKET
        self._client = None
        if self.supabase_url and self.service_key:
            try:
                from supabase import create_client
                self._client = create_client(self.supabase_url, self.service_key)
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")

    async def save(self, file_content: bytes, filename: str, user_id: str) -> str:
        if not self._client:
            # Fallback to local
            local = LocalStorageProvider()
            return await local.save(file_content, filename, user_id)
        
        storage_path = f"{user_id}/{filename}"
        try:
            # Supabase storage upload
            res = self._client.storage.from_(self.bucket).upload(
                path=storage_path,
                file=file_content,
                file_options={"cache-control": "3600", "upsert": "true"}
            )
            return storage_path
        except Exception as e:
            logger.error(f"Supabase storage upload failed: {e}. Fallback to local.")
            local = LocalStorageProvider()
            return await local.save(file_content, filename, user_id)

    async def get_path_or_url(self, storage_path: str) -> str:
        if self._client:
            try:
                url = self._client.storage.from_(self.bucket).get_public_url(storage_path)
                return url
            except Exception:
                pass
        local = LocalStorageProvider()
        return await local.get_path_or_url(storage_path)

    async def delete(self, storage_path: str) -> bool:
        if self._client:
            try:
                self._client.storage.from_(self.bucket).remove([storage_path])
                return True
            except Exception as e:
                logger.error(f"Supabase storage delete failed: {e}")
        local = LocalStorageProvider()
        return await local.delete(storage_path)


def get_storage_provider() -> StorageProvider:
    provider = settings.STORAGE_PROVIDER.lower()
    if provider == "supabase" and settings.SUPABASE_URL and (settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY):
        return SupabaseStorageProvider()
    return LocalStorageProvider()
