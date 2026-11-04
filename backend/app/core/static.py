"""Sirve la web compilada desde el propio backend (un solo servicio, mismo origen)."""
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles


def mount_frontend(app: FastAPI, directory: str) -> bool:
    root = Path(directory).resolve()
    index = root / "index.html"
    if not directory or not index.is_file():
        return False

    assets = root / "assets"
    if assets.is_dir():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        # Las rutas de la API que no existen devuelven 404, no la web
        if path == "api" or path.startswith("api/"):
            raise HTTPException(404, "No encontrado")
        candidate = (root / path).resolve()
        if path and candidate.is_file() and root in candidate.parents:
            return FileResponse(candidate)
        return FileResponse(index)  # rutas de React Router

    return True
