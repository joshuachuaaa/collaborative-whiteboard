CREATE TABLE strokes (
    id         UUID PRIMARY KEY,
    session_id UUID NOT NULL,
    owner_id   UUID NOT NULL,
    color      VARCHAR(8) NOT NULL,
    width      SMALLINT   NOT NULL,
    points     JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX strokes_by_session ON strokes (session_id);