// ===========================================
// In-memory Job Store para processamento assíncrono
// ===========================================

import { v4 as uuidv4 } from 'uuid';

export type JobStatus = 'processing' | 'done' | 'failed';

export interface Job<T = unknown> {
  id: string;
  status: JobStatus;
  result?: T;
  erro?: string;
  createdAt: Date;
}

const jobs = new Map<string, Job>();

const TTL_MS = 10 * 60 * 1000; // 10 minutos

export function createJob(): Job {
  const id = uuidv4();
  const job: Job = { id, status: 'processing', createdAt: new Date() };
  jobs.set(id, job);
  // Remove automaticamente após TTL para evitar vazamento de memória
  setTimeout(() => jobs.delete(id), TTL_MS);
  return job;
}

export function updateJob(id: string, updates: Partial<Omit<Job, 'id' | 'createdAt'>>): void {
  const job = jobs.get(id);
  if (job) {
    jobs.set(id, { ...job, ...updates });
  }
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}
