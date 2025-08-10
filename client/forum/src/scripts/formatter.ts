function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// suporte: headings (# ...), bold **text**, italic *text*, inline `code`, links [text](url), simple lists (- item)
export function formatToHtml(src: string): string {
  const lines = src.split("\n");
  const out: string[] = [];
  for (let line of lines) {
    line = escapeHtml(line);
    // heading
    if (/^#{1,6}\s+/.test(line)) {
      const level = line.match(/^#{1,6}/)![0].length;
      line = line.replace(/^#{1,6}\s+/, "");
      out.push(`<h${level}>${inlineFormat(line)}</h${level}>`);
      continue;
    }
    // list
    if (/^\s*-\s+/.test(line)) {
      // collect list block
      const items:string[] = [];
      while (lines.length && /^\s*-\s+/.test(lines[0])) {
        const l = escapeHtml(lines.shift()!);
        items.push(`<li>${inlineFormat(l.replace(/^\s*-\s+/, ""))}</li>`);
      }
      out.push(`<ul>${items.join("")}</ul>`);
      break; // we've consumed remaining lines via shift; simple approach
    }
    if (line.trim() === "") {
      out.push("<p></p>");
    } else {
      out.push(`<p>${inlineFormat(line)}</p>`);
    }
  }
  return out.join("\n");
}

function inlineFormat(s: string) {
  // code
  s = s.replace(/`([^`]+)`/g, (_, m) => `<code>${m}</code>`);
  // bold
  s = s.replace(/\*\*([^*]+)\*\*/g, (_, m) => `<strong>${m}</strong>`);
  // italic
  s = s.replace(/\*([^*]+)\*/g, (_, m) => `<em>${m}</em>`);
  // link [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    const u = url.startsWith("http") ? url : encodeURI(url);
    return `<a href="${u}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  });
  return s;
}
