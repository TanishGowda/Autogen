"""
Sample login authentication module for upload testing.
This file is intentionally simple but realistic enough for CFG/class/test generation.
"""

from __future__ import annotations

import hashlib
import hmac
import secrets
import time
from dataclasses import dataclass


def hash_password(password: str, salt: str) -> str:
    """Return SHA-256(password + salt)."""
    return hashlib.sha256(f"{password}{salt}".encode("utf-8")).hexdigest()


def verify_password(password: str, salt: str, password_hash: str) -> bool:
    """Constant-time password hash comparison."""
    calculated = hash_password(password, salt)
    return hmac.compare_digest(calculated, password_hash)


@dataclass
class User:
    id: int
    email: str
    salt: str
    password_hash: str
    is_active: bool = True


class InMemoryUserStore:
    def __init__(self) -> None:
        self._users_by_email: dict[str, User] = {}
        self._next_id = 1

    def create_user(self, email: str, password: str) -> User:
        normalized_email = email.strip().lower()
        if not normalized_email or "@" not in normalized_email:
            raise ValueError("Invalid email address.")
        if normalized_email in self._users_by_email:
            raise ValueError("User already exists.")
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters.")

        salt = secrets.token_hex(8)
        password_hash = hash_password(password, salt)
        user = User(
            id=self._next_id,
            email=normalized_email,
            salt=salt,
            password_hash=password_hash,
        )
        self._users_by_email[normalized_email] = user
        self._next_id += 1
        return user

    def get_by_email(self, email: str) -> User | None:
        return self._users_by_email.get(email.strip().lower())


class AuthService:
    def __init__(self, user_store: InMemoryUserStore) -> None:
        self.user_store = user_store
        self._sessions: dict[str, dict[str, str | int]] = {}

    def register(self, email: str, password: str) -> User:
        return self.user_store.create_user(email, password)

    def login(self, email: str, password: str) -> str:
        user = self.user_store.get_by_email(email)
        if user is None:
            raise PermissionError("Invalid credentials.")
        if not user.is_active:
            raise PermissionError("User account is disabled.")
        if not verify_password(password, user.salt, user.password_hash):
            raise PermissionError("Invalid credentials.")

        token = secrets.token_urlsafe(24)
        self._sessions[token] = {
            "user_id": user.id,
            "email": user.email,
            "created_at": int(time.time()),
        }
        return token

    def authenticate_token(self, token: str) -> bool:
        return token in self._sessions

    def logout(self, token: str) -> bool:
        if token in self._sessions:
            del self._sessions[token]
            return True
        return False


if __name__ == "__main__":
    store = InMemoryUserStore()
    auth = AuthService(store)

    user = auth.register("demo@example.com", "Password123")
    print(f"Registered user: {user.email} (id={user.id})")

    token = auth.login("demo@example.com", "Password123")
    print("Login successful. Session token:", token)

    print("Token valid?", auth.authenticate_token(token))
    auth.logout(token)
    print("Token valid after logout?", auth.authenticate_token(token))
