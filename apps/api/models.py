import uuid, datetime as dt
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB, SMALLINT

class Base(DeclarativeBase): pass

class Stroke(Base):
    __tablename__ = "strokes"
    id:         Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    session_id: Mapped[uuid.UUID]
    owner_id:   Mapped[uuid.UUID]
    color:      Mapped[str]
    width:      Mapped[int]      = mapped_column(SMALLINT)
    points:     Mapped[list]     = mapped_column(JSONB)
    created_at: Mapped[dt.datetime] = mapped_column(default=dt.datetime.utcnow)
