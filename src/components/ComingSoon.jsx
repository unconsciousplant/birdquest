// Placeholder box listing what a screen will contain once it's built.
export default function ComingSoon({ title = 'Coming next', items }) {
  return (
    <section className="card coming-soon">
      <h2 className="card-title">{title}</h2>
      <ul className="coming-soon-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}
