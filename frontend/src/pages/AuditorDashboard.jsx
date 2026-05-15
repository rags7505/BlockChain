import { useEffect, useState } from "react"
import { evidenceApi } from "../api/evidenceApi"
import FileUpload from "../components/FileUpload"
import EvidenceTable from "../components/EvidenceTable"

export default function AuditorDashboard() {
  const [data, setData] = useState([])

  const load = () => evidenceApi.list().then(r => setData(r.data))
  useEffect(load, [])

  return (
    <div className="page">
      <FileUpload onSuccess={load} />
      <EvidenceTable
        data={data}
        onView={e => window.open(evidenceApi.view(e.evidenceId))}
        onVerify={e => alert("Use verify modal")}
      />
    </div>
  )
}
