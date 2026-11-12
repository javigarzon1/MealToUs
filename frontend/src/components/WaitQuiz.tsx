import { useEffect, useMemo, useState } from "react";
import { QUESTIONS, shuffled } from "../data/quizQuestions";

/** Mini juego de preguntas sobre alimentación para hacer más corta la espera de la IA. */
export default function WaitQuiz() {
  const order = useMemo(() => shuffled(QUESTIONS), []);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ ok: 0, total: 0 });
  const quiz = order[i % order.length];
  // Las opciones llegan con la correcta siempre primera: se barajan al mostrar cada pregunta
  const options = useMemo(
    () => shuffled(quiz.options.map((text, k) => ({ text, correct: k === quiz.answer }))),
    [quiz],
  );
  useEffect(() => setPicked(null), [i]);

  const answered = picked !== null;
  const choose = (k: number) => {
    if (answered) return;
    setPicked(k);
    setScore((s) => ({ ok: s.ok + (options[k].correct ? 1 : 0), total: s.total + 1 }));
  };

  return (
    <section className="quiz" aria-label="Preguntas mientras esperas">
      <div className="quiz__head">
        <strong>Mientras esperas: ¿cuánto sabes de comer bien?</strong>
        <span className="quiz__score">{score.ok} / {score.total}</span>
      </div>
      <p className="quiz__q">{quiz.q}</p>
      <div className="quiz__options">
        {options.map((o, k) => {
          const state = !answered ? "" : o.correct ? " is-right" : k === picked ? " is-wrong" : "";
          return (
            <button key={o.text} type="button" className={`quiz__opt${state}`}
              onClick={() => choose(k)} disabled={answered && !state}>
              {o.text}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="quiz__result" role="status">
          <p><strong>{options[picked].correct ? "¡Correcto!" : "Casi."}</strong> {quiz.why}</p>
          <button type="button" className="btn btn--small" onClick={() => setI((n) => n + 1)}>
            Otra pregunta
          </button>
        </div>
      )}
    </section>
  );
}
