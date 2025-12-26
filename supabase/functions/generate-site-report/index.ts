import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { PDFDocument, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1"

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  const {
    site_name,
    address,
    local_planning_authority,
    decision_summary,
    risk_status,
    objection_likelihood,
    key_planning_considerations,
  } = await req.json()

  const pdf = await PDFDocument.create()
  const page = pdf.addPage()
  const font = await pdf.embedFont(StandardFonts.Helvetica)

  const { width, height } = page.getSize()
  let y = height - 50

  const draw = (text: string) => {
    page.drawText(text ?? "-", {
      x: 50,
      y,
      size: 11,
      font,
      maxWidth: width - 100,
    })
    y -= 18
  }

  draw("PLANNING DUE DILIGENCE REPORT")
  y -= 10

  draw(`Site: ${site_name}`)
  draw(`Address: ${address}`)
  draw(`Local Planning Authority: ${local_planning_authority}`)
  y -= 10

  draw(`Risk Status: ${risk_status}`)
  draw(`Objection Likelihood: ${objection_likelihood}`)
  y -= 10

  draw("Decision Summary:")
  draw(decision_summary)
  y -= 10

  draw("Key Planning Considerations:")
  draw(key_planning_considerations)

  const pdfBytes = await pdf.save()

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Planning_Report_${site_name}.pdf"`,
    },
  })
})
