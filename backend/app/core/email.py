"""Envío de correos. Sin SMTP configurado, el mensaje se escribe en el log del servidor."""
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("uvicorn.error")


def send_email(to: str, subject: str, body: str) -> None:
    if not settings.smtp_host:
        # Modo desarrollo: así se puede probar el flujo sin servidor de correo
        logger.warning("SMTP no configurado. Correo para %s\n  Asunto: %s\n%s", to, subject, body)
        return
    msg = EmailMessage()
    msg["From"] = settings.smtp_from or settings.smtp_user
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
            if settings.smtp_starttls:
                smtp.starttls()
            if settings.smtp_user:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(msg)
    except Exception:  # nunca debe romper la petición ni revelar si el email existe
        logger.exception("No se pudo enviar el correo a %s", to)


def send_password_reset(to: str, token: str) -> None:
    link = f"{settings.app_base_url.rstrip('/')}/restablecer?token={token}"
    send_email(
        to,
        "Restablece tu contraseña de MealToUs",
        "Hola,\n\n"
        "Has pedido restablecer tu contraseña. Abre este enlace (caduca en "
        f"{settings.reset_token_minutes} minutos y solo sirve una vez):\n\n{link}\n\n"
        "Si no lo pediste tú, ignora este correo: tu contraseña no cambiará.\n",
    )
