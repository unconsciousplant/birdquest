// A clearly visible label for anything that shows sample data.
// Show it wherever service results appear while `isMock` is true.
export default function MockDataNotice({ children }) {
  return (
    <aside className="mock-notice" role="note">
      <strong className="mock-notice-tag">Mock data</strong>
      <p className="mock-notice-text">
        {children ?? 'This is sample data for building the interface. It is not a real prediction.'}
      </p>
    </aside>
  )
}
