from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import asyncio, json, os, uuid
import redis.asyncio as redis
from sqlalchemy import delete, select
from apps.api.db import async_session
from apps.api.models import Stroke
import logging

SESSION_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")  # one global board
active: dict[str, list[float]] = {}          # {stroke_id: [x0,y0,…]}

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
CHANNEL   = "ink-events"

app = FastAPI()
redis_pool = redis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)

@app.get("/healthz")
async def health():
    return {"status": "ok"}

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    await getSnapShot(ws)
    cid = uuid.uuid4().hex # Create unique ID
    sub = redis_pool.pubsub()
    await sub.subscribe(CHANNEL)

    async def relay():
        async for m in sub.listen():      # Redis → this browser
            if m["type"] != "message":
                continue
            data = json.loads(m["data"])
            if data["from"] != cid:       # don’t echo to myself
                await ws.send_text(data["payload"])

    relay_task = asyncio.create_task(relay())

    try:                                  # browser → Redis (+ Postgres)
        async for raw in ws.iter_text():
            msg  = json.loads(raw)
            kind = msg.get("kind")

            # ------ update cache & DB when needed ------
            if kind == "stroke-start":
                active[msg["stroke"]["id"]] = [*msg["first"]]

            elif kind == "stroke-points":
                active[msg["id"]].extend(msg["pts"])

            elif kind == "stroke-end":
                pts = active.pop(msg["id"], [])
                async with async_session() as db:
                    await db.merge(Stroke(
                        id         = uuid.UUID(msg["id"]),
                        session_id = SESSION_ID,
                        owner_id   = uuid.UUID(msg["stroke"]["ownerId"]),
                        color      = msg["stroke"]["color"],
                        width      = msg["stroke"]["width"],
                        points     = pts,
                    ))
                    await db.commit()
                    
            elif kind == "undo":
                sid = msg["id"]                       # stroke id (str/UUID)

                # 1. Was it still being drawn?  -> just forget the points
                active.pop(sid, None)

                # 2. Delete from the database if already stored
                async with async_session() as db:
                    try:
                        stmt   = delete(Stroke).where(Stroke.id == uuid.UUID(sid))
                        result = await db.execute(stmt)
                        await db.commit()
                        logging.info("undo: deleted %s row(s) for stroke %s",
                        result.rowcount, sid)
                    except Exception as e:
                        await db.rollback()
                        logging.exception("undo failed: %s", e)


            # ------ real-time fan-out (unchanged) ------
            await redis_pool.publish(
                CHANNEL,
                json.dumps({"from": cid, "payload": raw}),
            )
    except WebSocketDisconnect:
        pass
    finally:
        relay_task.cancel()
        await sub.close()




async def getSnapShot(ws: WebSocket):
    async with async_session() as db:
        res = await db.execute(
            select(Stroke)
            .where(Stroke.session_id == SESSION_ID)
            .order_by(Stroke.created_at)
        )
        for s in res.scalars():                     
            await ws.send_text(json.dumps({         
                "kind": "stroke-full",
                "stroke": {
                    "id": str(s.id),                
                    "ownerId": str(s.owner_id),
                    "color": s.color,
                    "width": s.width,
                    "points": s.points,
                }
            }))

    for sid, pts in active.items():               
        await ws.send_text(json.dumps({
            "kind": "stroke-snapshot",
            "id":   sid,
            "points": pts,
        }))
