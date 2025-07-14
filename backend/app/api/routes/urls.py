from typing import Any, List

from fastapi import APIRouter, HTTPException, Query, Path, Body
from sqlmodel import select, func

from app.api.deps import CurrentUser, SessionDep
from app.models import CrawledURL, URLAnalysis
from pydantic import BaseModel

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

@router.post("/{id}/start", response_model=CrawledURL)
def start_crawl(
    *, session: SessionDep, current_user: CurrentUser, id: int = Path(...)
) -> Any:
    """
    Start processing/crawling a URL (set status to 'queued').
    """
    url = session.get(CrawledURL, id)
    if not url or url.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="URL not found")
    url.status = "queued"
    session.add(url)
    session.commit()
    session.refresh(url)
    return url

@router.post("/{id}/stop", response_model=CrawledURL)
def stop_crawl(
    *, session: SessionDep, current_user: CurrentUser, id: int = Path(...)
) -> Any:
    """
    Stop processing a URL (set status to 'stopped').
    """
    url = session.get(CrawledURL, id)
    if not url or url.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="URL not found")
    url.status = "stopped"
    session.add(url)
    session.commit()
    session.refresh(url)
    return url

class BulkIDs(BaseModel):
    ids: list[int]

@router.delete("/", response_model=dict)
def bulk_delete_urls(
    *, session: SessionDep, current_user: CurrentUser, ids: list[int] = Body(...)
) -> Any:
    """
    Bulk delete URLs by IDs (user-specific).
    """
    statement = select(CrawledURL).where(CrawledURL.user_id == current_user.id, CrawledURL.id.in_(ids))
    urls = session.exec(statement).all()
    for url in urls:
        session.delete(url)
    session.commit()
    return {"deleted": [url.id for url in urls]}

@router.post("/reanalyze", response_model=dict)
def bulk_reanalyze_urls(
    *, session: SessionDep, current_user: CurrentUser, ids: list[int] = Body(...)
) -> Any:
    """
    Bulk re-analyze URLs by IDs (set status to 'queued', user-specific).
    """
    statement = select(CrawledURL).where(CrawledURL.user_id == current_user.id, CrawledURL.id.in_(ids))
    urls = session.exec(statement).all()
    for url in urls:
        url.status = "queued"
        session.add(url)
    session.commit()
    return {"reanalyzed": [url.id for url in urls]} 