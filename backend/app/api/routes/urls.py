from typing import Any, List

from fastapi import APIRouter, HTTPException, Query, Path
from sqlmodel import select, func

from app.api.deps import CurrentUser, SessionDep
from app.models import CrawledURL, URLAnalysis

router = APIRouter(prefix="/urls", tags=["urls"])

@router.post("/", response_model=CrawledURL)
def add_url(
    *, session: SessionDep, current_user: CurrentUser, url: str
) -> Any:
    """
    Add a new URL for analysis (user-specific).
    """
    # Check for duplicate for this user
    statement = select(CrawledURL).where(CrawledURL.user_id == current_user.id, CrawledURL.url == url)
    existing = session.exec(statement).first()
    if existing:
        raise HTTPException(status_code=400, detail="URL already submitted.")
    crawled_url = CrawledURL(url=url, user_id=current_user.id)
    session.add(crawled_url)
    session.commit()
    session.refresh(crawled_url)
    return crawled_url

@router.get("/", response_model=List[CrawledURL])
def list_urls(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = Query(100, le=100),
) -> Any:
    """
    List URLs for the current user (paginated).
    """
    statement = (
        select(CrawledURL)
        .where(CrawledURL.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .order_by(CrawledURL.created_at.desc())
    )
    urls = session.exec(statement).all()
    return urls

@router.get("/{id}", response_model=URLAnalysis)
def get_url_analysis(
    *, session: SessionDep, current_user: CurrentUser, id: int = Path(...)
) -> Any:
    """
    Get analysis results for a specific URL (user-specific).
    """
    url = session.get(CrawledURL, id)
    if not url or url.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="URL not found")
    if not url.analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return url.analysis 