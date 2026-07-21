from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth_router, friends_router, messages_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Social Store API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(friends_router.router)
app.include_router(messages_router.router)


@app.get("/")
def root():
    return {"status": "ok", "message": "Social Store API is running"}