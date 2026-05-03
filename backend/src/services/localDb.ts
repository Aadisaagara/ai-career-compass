import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const RESUMES_FILE = path.join(DATA_DIR, "resumes.json");
const GENERATED_RESUMES_FILE = path.join(DATA_DIR, "generated_resumes.json");

async function init() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

export async function getResumes(userId: string) {
  await init();
  try {
    const data = await fs.readFile(RESUMES_FILE, "utf-8");
    const resumes = JSON.parse(data);
    return resumes.filter((r: any) => r.user_id === userId).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch {
    return [];
  }
}

export async function insertResume(resume: any) {
  await init();
  const resumes = await getAllResumes();
  const newResume = { id: randomUUID(), created_at: new Date().toISOString(), ...resume };
  resumes.push(newResume);
  await fs.writeFile(RESUMES_FILE, JSON.stringify(resumes, null, 2));
  return newResume;
}

export async function updateResume(id: string, userId: string, updates: any) {
  await init();
  const resumes = await getAllResumes();
  const index = resumes.findIndex((r: any) => r.id === id && r.user_id === userId);
  if (index === -1) return null;
  resumes[index] = { ...resumes[index], ...updates };
  await fs.writeFile(RESUMES_FILE, JSON.stringify(resumes, null, 2));
  return resumes[index];
}

export async function deleteResume(id: string, userId: string) {
  await init();
  const resumes = await getAllResumes();
  const index = resumes.findIndex((r: any) => r.id === id && r.user_id === userId);
  if (index === -1) return null;
  const deleted = resumes.splice(index, 1)[0];
  await fs.writeFile(RESUMES_FILE, JSON.stringify(resumes, null, 2));
  return deleted;
}

export async function resetDefaultResume(userId: string) {
  await init();
  const resumes = await getAllResumes();
  let changed = false;
  for (const r of resumes) {
    if (r.user_id === userId && r.is_default) {
      r.is_default = false;
      changed = true;
    }
  }
  if (changed) {
    await fs.writeFile(RESUMES_FILE, JSON.stringify(resumes, null, 2));
  }
}

async function getAllResumes() {
  try {
    const data = await fs.readFile(RESUMES_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function getGeneratedResumes(userId: string) {
  await init();
  try {
    const data = await fs.readFile(GENERATED_RESUMES_FILE, "utf-8");
    const resumes = JSON.parse(data);
    return resumes.filter((r: any) => r.user_id === userId).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch {
    return [];
  }
}

export async function insertGeneratedResume(resume: any) {
  await init();
  const resumes = await getAllGeneratedResumes();
  const newResume = { id: randomUUID(), created_at: new Date().toISOString(), ...resume };
  resumes.push(newResume);
  await fs.writeFile(GENERATED_RESUMES_FILE, JSON.stringify(resumes, null, 2));
  return newResume;
}

export async function deleteGeneratedResume(id: string, userId: string) {
  await init();
  const resumes = await getAllGeneratedResumes();
  const index = resumes.findIndex((r: any) => r.id === id && r.user_id === userId);
  if (index === -1) return null;
  const deleted = resumes.splice(index, 1)[0];
  await fs.writeFile(GENERATED_RESUMES_FILE, JSON.stringify(resumes, null, 2));
  return deleted;
}

async function getAllGeneratedResumes() {
  try {
    const data = await fs.readFile(GENERATED_RESUMES_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}
