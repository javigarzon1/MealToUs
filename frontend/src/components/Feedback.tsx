import { Link } from "react-router-dom";

export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="note note--err" role="alert">
      <p>{message}</p>
    </div>
  );
}

export function Loading({ text }: { text: string }) {
  return (
    <div className="note note--loading" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}

/** Aviso con enlace cuando falta un paso previo. */
export function Missing({ text, to, cta }: { text: string; to: string; cta: string }) {
  return (
    <div className="note note--warn">
      <p>{text}</p>
      <Link className="btn btn--small" to={to}>
        {cta}
      </Link>
    </div>
  );
}
