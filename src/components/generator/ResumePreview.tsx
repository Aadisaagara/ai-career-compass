import React from "react";
import { TailoredResumeResponse } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ResumePreviewProps {
  data: TailoredResumeResponse;
}

export function ResumePreview({ data }: ResumePreviewProps) {
  return (
    <div className="bg-white text-slate-900 p-8 shadow-lg border rounded-sm max-w-[800px] mx-auto font-serif min-h-[1000px] flex flex-col">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-slate-800 mb-2">
          {data.contactHeader.name}
        </h1>
        <div className="text-sm text-slate-600 flex flex-wrap justify-center gap-x-4 gap-y-1">
          {data.contactHeader.email && <span>{data.contactHeader.email}</span>}
          {data.contactHeader.phone && <span>{data.contactHeader.phone}</span>}
          {data.contactHeader.location && <span>{data.contactHeader.location}</span>}
          {data.contactHeader.linkedin && (
            <span className="text-blue-600 underline">LinkedIn</span>
          )}
        </div>
      </div>

      <div className="border-b-2 border-slate-800 mb-6" />

      {/* Summary */}
      <section className="mb-6">
        <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide mb-2">
          Professional Summary
        </h2>
        <p className="text-sm leading-relaxed text-slate-700 text-justify">
          {data.professionalSummary}
        </p>
      </section>

      {/* Skills */}
      <section className="mb-6">
        <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide mb-2">
          Core Competencies
        </h2>
        <div className="grid grid-cols-3 gap-x-4 gap-y-1">
          {data.coreCompetencies.map((skill, i) => (
            <div key={i} className="text-sm text-slate-700 flex items-center gap-2">
              <span className="text-slate-400 text-[10px]">■</span>
              {skill}
            </div>
          ))}
        </div>
      </section>

      {/* Experience */}
      <section className="mb-6 flex-1">
        <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide mb-3">
          Professional Experience
        </h2>
        <div className="space-y-5">
          {data.workExperience.map((exp, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-bold text-slate-800">{exp.title}</h3>
                <span className="text-sm italic text-slate-600">{exp.duration}</span>
              </div>
              <div className="text-sm font-semibold text-slate-700 mb-2">
                {exp.company}
              </div>
              <ul className="list-disc list-outside ml-4 space-y-1 text-sm text-slate-700">
                {exp.bullets.map((bullet, j) => (
                  <li key={j} className="pl-1">
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Education */}
      {data.education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide mb-3">
            Education
          </h2>
          <div className="space-y-3">
            {data.education.map((edu, i) => (
              <div key={i} className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-slate-800 text-sm">{edu.degree}</span>
                  <div className="text-sm text-slate-600">{edu.institution}</div>
                </div>
                <span className="text-sm italic text-slate-600">{edu.year}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {data.certifications.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide mb-2">
            Certifications
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
            {data.certifications.map((cert, i) => (
              <span key={i}>
                {cert}
                {i < data.certifications.length - 1 && (
                  <span className="ml-4 text-slate-300">|</span>
                )}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
