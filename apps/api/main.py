from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import asyncio, json, os, uuid, redis.asyncio as redis

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
    cid = uuid.uuid4().hex                # unique per socket

    # Create ONE subscription for THIS socket
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

    try:                                  # browser → Redis
        async for raw in ws.iter_text():
            await redis_pool.publish(
                CHANNEL,
                json.dumps({"from": cid, "payload": raw}),
            )
    except WebSocketDisconnect:
        pass
    finally:
        relay_task.cancel()
        await sub.close()
