from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Meta Dashboard AI Agent")

class Query(BaseModel):
    text: str

@app.get("/")
async def root():
    return {"message": "AI Agent is running"}

@app.post("/chat")
async def chat(query: Query):
    # TODO: Implement AI Agent logic
    return {"response": f"Echo: {query.text}"}
