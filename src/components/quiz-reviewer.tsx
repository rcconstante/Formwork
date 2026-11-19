"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { exampleText, maxImportLength, parseQuiz, quizPrompt, type Quiz } from "@/lib/quiz";

type Session = { quiz: Quiz; answers: (number | null)[]; index: number; finished: boolean };
const key = "formwork.quiz.v1";
const optionLetter = (index: number) => String.fromCharCode(65 + index);

export default function QuizReviewer() {
  const [input, setInput] = useState("");
  const [moduleText, setModuleText] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [selected, select] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [storageNotice, setStorageNotice] = useState("");
  const promptField = useRef<HTMLTextAreaElement>(null);
  const review = useRef<HTMLElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        const saved = JSON.parse(raw);
        const quiz = parseQuiz(JSON.stringify(saved.quiz));
        const answers = quiz.questions.map((question, index) => {
          const value = saved.answers?.[index];
          return Number.isInteger(value) && value >= 0 && value < question.options.length ? value as number : null;
        });
        const firstUnanswered = answers.indexOf(null);
        const index = Number.isInteger(saved.index) && saved.index >= 0 ? Math.min(saved.index, quiz.questions.length - 1) : 0;
        setSession({ quiz, answers, index: firstUnanswered < 0 ? index : Math.min(index, firstUnanswered), finished: firstUnanswered < 0 && saved.finished === true });
      } catch {
        setStorageNotice("The previous quiz could not be restored. You can import another one.");
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  function save(next: Session) {
    setSession(next);
    setStorageNotice("");
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      setStorageNotice("Your quiz is available now, but this browser could not save its progress.");
    }
  }

  function importQuiz() {
    try {
      const quiz = parseQuiz(input);
      save({ quiz, answers: quiz.questions.map(() => null), index: 0, finished: false });
      select(null);
      setError("");
      setStatus(`Imported ${quiz.questions.length} questions.`);
      requestAnimationFrame(() => review.current?.focus());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not read these questions.");
      setStatus("");
    }
  }

  async function readFile(file: File | undefined) {
    if (!file) return;
    if (!/\.(txt|md|json)$/i.test(file.name) || file.size > maxImportLength * 4) {
      setError("Choose a .txt, .md, or .json file within the import limit.");
      return;
    }
    try {
      const text = await file.text();
      if (text.length > maxImportLength) throw Error("The file exceeds 200,000 characters.");
      setInput(text);
      setError("");
      setStatus(`Loaded ${file.name}. Select Import to check the questions.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not read that text file.");
    }
  }

  const prompt = moduleText.trim() ? quizPrompt.replace("[Paste your study module here]", () => moduleText.trim()) : quizPrompt;
  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyStatus(moduleText.trim() ? "Prompt and module copied." : "Prompt copied.");
    } catch {
      const details = promptField.current?.closest("details");
      if (details) details.open = true;
      promptField.current?.focus();
      promptField.current?.select();
      setCopyStatus("Prompt selected. Use your device’s Copy command.");
    }
  }

  const question = session?.quiz.questions[session.index];
  const submitted = session?.answers[session.index] ?? null;
  const score = session?.answers.filter((value, index) => value === session.quiz.questions[index].answerIndex).length ?? 0;

  return (
    <main className="wrap inner studio quiz-page">
      <Link className="back" href="/#features">← All tools</Link>
      <h1>Quiz reviewer</h1>
      <p>Bring your own questions or turn a study module into a practice quiz.</p>
      <div className="studio-columns quiz-import-grid">
        <section className="panel studio-panel">
          <h2>Generate with ChatGPT or Claude</h2>
          <p>Copy the prompt, paste it into your AI chat with your study module, then bring the generated questions back here.</p>
          <label className="studio-field">Study module (optional)
            <textarea rows={4} value={moduleText} maxLength={maxImportLength} onChange={event => { setModuleText(event.target.value); setCopyStatus(""); }} placeholder="Paste module text here to include it in the copied prompt." />
          </label>
          <button className="primary" type="button" onClick={copyPrompt}><HugeiconsIcon icon={Copy01Icon} size={17} />{moduleText.trim() ? "Copy prompt + module" : "Copy AI prompt"}</button>
          <span className="quiz-status" role="status">{copyStatus}</span>
          <details className="quiz-help" open={copyStatus.includes("selected") || undefined}>
            <summary>View the prompt</summary>
            <textarea ref={promptField} aria-label="AI quiz prompt" value={prompt} readOnly rows={6} />
          </details>
        </section>

        <section className="panel studio-panel">
          <div className="sectitle"><h2>Import questions</h2><button className="sample" type="button" onClick={() => { setInput(exampleText); setError(""); setStatus(""); }}>Load sample</button></div>
          <p>Use JSON from the prompt, or numbered questions with A–F choices and an answer for each question.</p>
          <label className="studio-field">Question text
            <textarea rows={8} value={input} maxLength={maxImportLength} onChange={event => { setInput(event.target.value); setError(""); setStatus(""); }} placeholder="Paste your quiz here…" />
          </label>
          <label className="studio-field">Or upload a .txt, .md, or .json file
            <input type="file" accept=".txt,.md,.json,text/plain,application/json" onChange={event => {
              void readFile(event.target.files?.[0]);
              event.target.value = "";
            }} />
          </label>
          <button className="primary" type="button" onClick={importQuiz}>{session ? "Import and replace current quiz" : "Import quiz"}</button>
          {error && <p className="quiz-error" role="alert">{error}</p>}
          <span role="status" className="quiz-status">{status}</span>
        </section>
      </div>

      {storageNotice && <p role="status">{storageNotice}</p>}
      {session && question && (
        <section className="panel studio-panel quiz-review" ref={review} tabIndex={-1}>
          <div className="sectitle">
            <h2>{session.quiz.title}</h2>
            <button className="sample" type="button" onClick={() => {
              save({ ...session, answers: session.quiz.questions.map(() => null), index: 0, finished: false });
              select(null);
            }}>Restart quiz</button>
          </div>
          {session.finished ? (
            <>
              <div className="studio-total"><span>Score</span><strong>{score} / {session.quiz.questions.length}</strong></div>
              {session.quiz.questions.map((item, index) => (
                <details className="quiz-result" key={index}>
                  <summary>{session.answers[index] === item.answerIndex ? "Correct" : "Incorrect"} · {item.question}</summary>
                  <p>Your answer: {item.options[session.answers[index] ?? -1] ?? "—"}</p>
                  <p>Correct answer: {item.options[item.answerIndex]}</p>
                  {item.explanation && <p>{item.explanation}</p>}
                </details>
              ))}
            </>
          ) : (
            <>
              <p>Question {session.index + 1} of {session.quiz.questions.length}</p>
              <fieldset className="quiz-question">
                <legend>{question.question}</legend>
                {question.options.map((option, index) => (
                  <label className="quiz-option" key={index} data-answer={submitted !== null && index === question.answerIndex} data-incorrect={submitted === index && submitted !== question.answerIndex}>
                    <input type="radio" name="quiz-choice" checked={(submitted ?? selected) === index} disabled={submitted !== null} onChange={() => select(index)} />
                    <span>{optionLetter(index)}. {option}</span>
                  </label>
                ))}
              </fieldset>
              {submitted === null ? (
                <button className="primary" type="button" disabled={selected === null} onClick={() => save({
                  ...session, answers: session.answers.map((answer, index) => index === session.index ? selected : answer),
                })}>Check answer</button>
              ) : (
                <>
                  <div className="quiz-feedback" role="status">
                    <b>{submitted === question.answerIndex ? "Correct." : `Correct answer: ${question.options[question.answerIndex]}.`}</b>
                    {question.explanation && <p>{question.explanation}</p>}
                  </div>
                  <button className="primary" type="button" onClick={() => {
                    select(null);
                    if (session.index === session.quiz.questions.length - 1) save({ ...session, finished: true });
                    else save({ ...session, index: session.index + 1 });
                  }}>{session.index === session.quiz.questions.length - 1 ? "See results" : "Next question"}</button>
                </>
              )}
            </>
          )}
        </section>
      )}
    </main>
  );
}


