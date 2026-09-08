import asyncio
import json
import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import User, Conversation, Message
from auth import get_current_user
from rag.chatbot_engine import generate_chat_response

router = APIRouter(prefix="/api/chat", tags=["Assistant IA - Chatbot"])

class ChatPrompt(BaseModel):
    conversation_id: Optional[str] = None
    question: str

class MessageOut(BaseModel):
    id: str
    sender: str
    content: str
    sources: Optional[list] = None
    lineage_flow: Optional[dict] = None
    created_at: str

class ConversationOut(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    last_message: Optional[str] = None

@router.get("/conversations", response_model=List[ConversationOut])
def get_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    convs = db.query(Conversation).filter(Conversation.user_id == current_user.id).order_by(Conversation.updated_at.desc()).all()
    result = []
    for c in convs:
        last_msg = c.messages[-1].content if c.messages else ""
        result.append({
            "id": c.id,
            "title": c.title,
            "created_at": c.created_at.isoformat(),
            "updated_at": c.updated_at.isoformat(),
            "last_message": last_msg[:50] + ("..." if len(last_msg) > 50 else "")
        })
    return result

@router.get("/conversations/{conversation_id}", response_model=List[MessageOut])
def get_conversation_messages(conversation_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Discussion non trouvée.")
    
    msgs = []
    for m in conv.messages:
        msgs.append({
            "id": m.id,
            "sender": m.sender,
            "content": m.content,
            "sources": m.sources,
            "lineage_flow": m.lineage_flow,
            "created_at": m.created_at.isoformat()
        })
    return msgs

@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(conversation_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Discussion non trouvée.")
    db.delete(conv)
    db.commit()
    return None

@router.post("/prompt")
def ask_assistant(prompt: ChatPrompt, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Obtenir ou créer la conversation
    if prompt.conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == prompt.conversation_id, Conversation.user_id == current_user.id).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Discussion non trouvée.")
    else:
        title = prompt.question[:40] + ("..." if len(prompt.question) > 40 else "")
        conv = Conversation(user_id=current_user.id, title=title)
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # Sauvegarder le message utilisateur
    user_msg = Message(
        conversation_id=conv.id,
        sender="user",
        content=prompt.question
    )
    db.add(user_msg)
    db.commit()

    # Obtenir la réponse du moteur RAG / Chatbot avec mémoire conversationnelle
    history_messages = [
        {"sender": m.sender, "content": m.content}
        for m in conv.messages
    ]
    # Temps de génération de réponse fixe à exactement 2 secondes
    time.sleep(2.0)

    bot_result = generate_chat_response(prompt.question, history_messages, conv.id)

    # Sauvegarder la réponse de l'assistant
    bot_msg = Message(
        conversation_id=conv.id,
        sender="assistant",
        content=bot_result["answer"],
        sources=bot_result.get("sources"),
        lineage_flow=bot_result.get("lineage_flow")
    )
    db.add(bot_msg)
    conv.title = prompt.question[:35]
    db.commit()

    return {
        "conversation_id": conv.id,
        "title": conv.title,
        "answer": bot_result["answer"],
        "sources": bot_result.get("sources"),
        "lineage_flow": bot_result.get("lineage_flow")
    }
