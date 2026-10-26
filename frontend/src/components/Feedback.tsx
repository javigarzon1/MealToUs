import { Link } from "react-router-dom";

export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="notice err" role="alert">
      {message}
    </div>
  );
}

export function Loading({ text }: { text: string }) {
  return (
    <div className="notice info row" role="status">
      <span className="spinner" aria-hidden="true" /> {text}
    </div>
  );
}

/** Aviso con enlace cuando falta un paso previo. */
export function Missing({ text, to, cta }: { text: string; to: string; cta: string }) {
  return (
    <div className="notice warn row spread">
      <span>{text}</span>
      <Link className="btn" to={to}>
        {cta}
      </Link>
    </div>
  );
}
