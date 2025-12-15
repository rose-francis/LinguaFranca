from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter()

class SignUpModel(BaseModel):
    name: str
    email: str
    password: str

class SignInModel(BaseModel):
    email: str
    password: str


@router.post("/signup")
def signup(user: SignUpModel):
    try:
        res = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password
        })

        if res.user is None:
            raise HTTPException(status_code=400, detail="Signup failed")

        # Insert additional user profile info
        supabase.table("profiles").insert({
            "id": res.user.id,
            "name": user.name,
            "email": user.email,
        }).execute()

        return {"message": "Signup successful", "user_id": res.user.id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/signin")
def signin(user: SignInModel):
    try:
        res = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })

        # Ensure user exists
        auth_user = res.user or (res.session and res.session.user)

        if auth_user is None:
            raise HTTPException(status_code=400, detail="Invalid email or password")

        return {
            "message": "Login successful",
            "access_token": res.session.access_token
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/logout")
def logout(response: Response):
    # If using cookies/session:
    response.delete_cookie(key="access_token")
    return {"message": "Logged out successfully"}
