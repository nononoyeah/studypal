import pytest
from fastapi import Depends
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.deps import get_current_user
from app.main import app as real_app
from app.models import User


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine)
    session = TestingSession()
    yield session
    session.close()
    engine.dispose()


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    @real_app.get("/protected")
    def protected(user: User = Depends(get_current_user)):
        return {"id": user.id, "username": user.username}

    real_app.dependency_overrides[get_db] = override_get_db
    with TestClient(real_app) as c:
        yield c
    real_app.dependency_overrides.pop(get_db)
    real_app.router.routes = [
        r for r in real_app.router.routes if getattr(r, "path", "") != "/protected"
    ]


@pytest.fixture
def test_user(db_session):
    user = User(username="alice", password_hash="x", streak=0, xp=0)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user
