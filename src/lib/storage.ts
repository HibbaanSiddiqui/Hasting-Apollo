import { Submission } from "./types";

const STORAGE_KEY = "authforge_submissions";

export function loadSubmissions(): Submission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSubmissions(submissions: Submission[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
}

export function addSubmission(submission: Submission): Submission[] {
  const submissions = loadSubmissions();
  submissions.unshift(submission);
  saveSubmissions(submissions);
  return submissions;
}

export function updateSubmission(id: string, updates: Partial<Submission>): Submission[] {
  const submissions = loadSubmissions();
  const idx = submissions.findIndex((s) => s.id === id);
  if (idx !== -1) {
    submissions[idx] = { ...submissions[idx], ...updates };
    saveSubmissions(submissions);
  }
  return submissions;
}
