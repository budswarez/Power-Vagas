export function printResume(c) {
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const socials = [
    c.socials?.linkedin  && `LinkedIn: ${c.socials.linkedin}`,
    c.socials?.github    && `GitHub: ${c.socials.github}`,
    c.socials?.portfolio && `Portfolio: ${c.socials.portfolio}`,
  ].filter(Boolean)

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Currículo — ${esc(c.name)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11pt;color:#1e293b;background:#fff;padding:36px 44px}
h1{font-size:22pt;font-weight:700;color:#0f172a;margin-bottom:3px}
.sub{font-size:11pt;color:#64748b;margin-bottom:10px}
.meta{display:flex;gap:18px;font-size:9.5pt;color:#64748b;margin-bottom:14px;flex-wrap:wrap}
.badges{display:flex;gap:7px;margin-bottom:22px;flex-wrap:wrap}
.badge{font-size:9pt;padding:2px 10px;border-radius:20px;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0}
.sec{margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid #f1f5f9}
.sec:last-child{border-bottom:none}
.sec-title{font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;margin-bottom:10px}
p{font-size:10.5pt;line-height:1.65;color:#475569}
.skills{display:flex;flex-wrap:wrap;gap:6px}
.skill{font-size:9.5pt;padding:2px 9px;border-radius:4px;background:#f8fafc;border:1px solid #e2e8f0;color:#334155}
.exp{margin-bottom:12px;padding-left:12px;border-left:2px solid #e2e8f0}
.exp-role{font-size:11pt;font-weight:600;color:#0f172a}
.exp-co{font-size:9.5pt;color:#94a3b8;margin-bottom:3px}
.exp-sum{font-size:10pt;color:#64748b}
.edu-deg{font-size:11pt;font-weight:600;color:#0f172a}
.edu-meta{font-size:9.5pt;color:#94a3b8}
.links{display:flex;flex-direction:column;gap:3px;font-size:10pt;color:#475569}
@media print{body{padding:8mm}@page{margin:20mm 22mm 18mm;size:A4}}
</style></head><body>
<h1>${esc(c.name)}</h1>
${c.role ? `<div class="sub">${esc(c.role)}</div>` : ''}
<div class="meta">
  ${c.location ? `<span>${esc(c.location)}</span>` : ''}
  ${c.email   ? `<span>${esc(c.email)}</span>`    : ''}
  ${c.phone   ? `<span>${esc(c.phone)}</span>`    : ''}
</div>
<div class="badges">
  ${c.seniority    ? `<span class="badge">${esc(c.seniority)}</span>`                        : ''}
  ${c.availability ? `<span class="badge">Disponibilidade: ${esc(c.availability)}</span>`    : ''}
  ${c.yearsExp     ? `<span class="badge">${c.yearsExp} anos de exp.</span>`                 : ''}
</div>
${c.summary ? `<div class="sec"><div class="sec-title">Resumo</div><p>${esc(c.summary)}</p></div>` : ''}
${c.skills?.length ? `<div class="sec"><div class="sec-title">Competências</div><div class="skills">${c.skills.map((s) => `<span class="skill">${esc(s)}</span>`).join('')}</div></div>` : ''}
${c.experiences?.length ? `<div class="sec"><div class="sec-title">Experiência (${c.yearsExp} anos)</div>${c.experiences.map((e) => `<div class="exp"><div class="exp-role">${esc(e.role)}</div><div class="exp-co">${esc(e.company)} · ${esc(e.period)}</div>${e.summary ? `<div class="exp-sum">${esc(e.summary)}</div>` : ''}</div>`).join('')}</div>` : ''}
${c.education?.length ? `<div class="sec"><div class="sec-title">Formação</div>${c.education.map((e) => `<div style="margin-bottom:8px"><div class="edu-deg">${esc(e.degree)}</div><div class="edu-meta">${esc(e.school)} · ${esc(e.year)}</div></div>`).join('')}</div>` : ''}
${socials.length ? `<div class="sec"><div class="sec-title">Links</div><div class="links">${socials.map((s) => `<span>${esc(s)}</span>`).join('')}</div></div>` : ''}
</body></html>`

  const win = window.open('', '_blank')
  if (!win) { alert('Permita pop-ups neste site para baixar o currículo em PDF.'); return }
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.print()
}
