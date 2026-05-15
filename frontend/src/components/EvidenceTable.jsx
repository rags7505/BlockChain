export default function EvidenceTable({ data, onView, onVerify, onLogs }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Case</th>
          <th>File</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map(e => (
          <tr key={e.evidenceId}>
            <td>{e.caseId}</td>
            <td>{e.fileName}</td>
            <td>
              <button onClick={() => onView(e)}>Open</button>
              {onVerify && <button onClick={() => onVerify(e)}>Verify</button>}
              {onLogs && <button onClick={() => onLogs(e)}>Logs</button>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
