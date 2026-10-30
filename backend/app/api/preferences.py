import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import UserModel
from app.models.user_preferences import UserPreferencesModel
from app.schemas.preferences import UserPreferences

router = APIRouter(prefix="/preferences", tags=["preferences"])


def _to_schema(row: UserPreferencesModel | None) -> UserPreferences:
    if row is None:
        return UserPreferences(people=1, allergies=[], intolerances=[], dislikes=[])
    return UserPreferences(
        people=row.people,
        allergies=json.loads(row.allergies or "[]"),
        intolerances=json.loads(row.intolerances or "[]"),
        dislikes=json.loads(row.dislikes or "[]"),
    )


def _get_row(db: Session, user: UserModel) -> UserPreferencesModel | None:
    return db.query(UserPreferencesModel).filter(UserPreferencesModel.user_id == user.id).first()


@router.get("", response_model=UserPreferences)
def get_preferences(db: Session = Depends(get_db), user: UserModel = Depends(get_current_user)):
    return _to_schema(_get_row(db, user))


@router.post("", response_model=UserPreferences)
def save_preferences(prefs: UserPreferences, db: Session = Depends(get_db),
                     user: UserModel = Depends(get_current_user)):
    row = _get_row(db, user) or UserPreferencesModel(user_id=user.id)
    row.people = prefs.people
    row.allergies = json.dumps(prefs.allergies, ensure_ascii=False)
    row.intolerances = json.dumps(prefs.intolerances, ensure_ascii=False)
    row.dislikes = json.dumps(prefs.dislikes, ensure_ascii=False)
    db.add(row)
    db.commit()
    return _to_schema(row)
