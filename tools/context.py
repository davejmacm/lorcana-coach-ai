from contextvars import ContextVar

current_token: ContextVar[str] = ContextVar("current_token", default="")
current_player_id: ContextVar[str] = ContextVar("current_player_id", default="")
