import solracLogo from "@assets/WhatsApp_Image_2026-02-13_at_01.09.05_1771165708652.jpeg";

interface PrintColumn {
  header: string;
  align?: "left" | "right" | "center";
}

interface PrintReportOptions {
  title: string;
  subtitle?: string;
  period?: string;
  columns: PrintColumn[];
  rows: string[][];
  totals?: string[];
  sections?: {
    title: string;
    columns: PrintColumn[];
    rows: string[][];
    totals?: string[];
  }[];
}

export function printReport(options: PrintReportOptions) {
  const { title, subtitle, period, columns, rows, totals, sections } = options;

  const buildTable = (cols: PrintColumn[], trs: string[][], tfoot?: string[]) => {
    const alignStyle = (a?: string) => a === "right" ? "text-align:right" : a === "center" ? "text-align:center" : "text-align:left";
    let html = `<table><thead><tr>`;
    cols.forEach((c) => {
      html += `<th style="${alignStyle(c.align)}">${c.header}</th>`;
    });
    html += `</tr></thead><tbody>`;
    trs.forEach((row) => {
      html += `<tr>`;
      row.forEach((cell, i) => {
        html += `<td style="${alignStyle(cols[i]?.align)}">${cell}</td>`;
      });
      html += `</tr>`;
    });
    html += `</tbody>`;
    if (tfoot && tfoot.length > 0) {
      html += `<tfoot><tr>`;
      tfoot.forEach((cell, i) => {
        html += `<td style="${alignStyle(cols[i]?.align)};font-weight:700">${cell}</td>`;
      });
      html += `</tr></tfoot>`;
    }
    html += `</table>`;
    return html;
  };

  let body = "";

  if (rows.length > 0 || (!sections || sections.length === 0)) {
    body += buildTable(columns, rows, totals);
  }

  if (sections) {
    sections.forEach((sec) => {
      body += `<h2 style="margin-top:24px;font-size:14px;border-bottom:1px solid #ddd;padding-bottom:4px">${sec.title}</h2>`;
      body += buildTable(sec.columns, sec.rows, sec.totals);
    });
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR") + " " + now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #222; padding: 20px; }
  .header { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #333; padding-bottom: 12px; }
  .header h1 { font-size: 18px; margin-bottom: 2px; }
  .header .subtitle { font-size: 12px; color: #666; }
  .header .period { font-size: 13px; font-weight: 600; margin-top: 4px; }
  .header .date { font-size: 10px; color: #999; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #f5f5f5; border: 1px solid #ccc; padding: 6px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px; }
  td { border: 1px solid #ddd; padding: 5px 8px; font-size: 11px; }
  tbody tr:nth-child(even) { background: #fafafa; }
  tfoot td { background: #f0f0f0; border-top: 2px solid #999; font-size: 11px; }
  h2 { font-size: 14px; }
  .footer { margin-top: 24px; text-align: center; font-size: 9px; color: #aaa; border-top: 1px solid #ddd; padding-top: 8px; }
  @media print {
    body { padding: 10px; }
    @page { margin: 15mm; size: A4; }
  }
</style>
</head>
<body>
  <div class="header">
    <img src="${solracLogo}" alt="Solrac Moto" style="height:50px;margin-bottom:8px;" />
    <h1>Solrac Moto - ${title}</h1>
    ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
    ${period ? `<div class="period">${period}</div>` : ""}
    <div class="date">Gerado em: ${dateStr}</div>
  </div>
  ${body}
  <div class="footer">Solrac Moto</div>
  <script>window.onload=function(){window.print()}</script>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
