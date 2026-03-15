import './card.css'

function Card({ className = '', ...props }) {
  const classes = ['card', className].filter(Boolean).join(' ')

  return <div data-slot="card" className={classes} {...props} />
}

function CardContent({ className = '', ...props }) {
  const classes = ['card__content', className].filter(Boolean).join(' ')

  return <div data-slot="card-content" className={classes} {...props} />
}

export { Card, CardContent }
