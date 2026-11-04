"""Despliegue: URL de Postgres y servir la web desde el backend."""
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.core.static import mount_frontend


def test_postgres_url_gets_psycopg_driver():
    assert Settings(database_url="postgres://u:p@h/db").database_url == "postgresql+psycopg://u:p@h/db"
    assert Settings(database_url="postgresql://u:p@h/db?sslmode=require").database_url \
        == "postgresql+psycopg://u:p@h/db?sslmode=require"
    assert Settings(database_url="sqlite:///./x.db").database_url == "sqlite:///./x.db"


def test_frontend_is_served_with_spa_fallback(tmp_path):
    (tmp_path / "assets").mkdir()
    (tmp_path / "assets" / "app.js").write_text("console.log(1)")
    (tmp_path / "index.html").write_text("<html>web</html>")
    (tmp_path / "logo.svg").write_text("<svg/>")
    app = FastAPI()

    @app.get("/api/ping")
    def ping():
        return {"ok": True}

    assert mount_frontend(app, str(tmp_path)) is True
    c = TestClient(app)
    assert c.get("/api/ping").json() == {"ok": True}
    assert c.get("/api/no-existe").status_code == 404
    assert "web" in c.get("/semana").text           # ruta de React Router
    assert c.get("/logo.svg").text == "<svg/>"
    assert c.get("/assets/app.js").text == "console.log(1)"
    assert "web" in c.get("/../../etc/passwd").text  # no sale de la carpeta


def test_no_frontend_dir_does_nothing(tmp_path):
    assert mount_frontend(FastAPI(), "") is False
    assert mount_frontend(FastAPI(), str(tmp_path)) is False
