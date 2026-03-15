import './input.css'

function Input({ className = '', type = 'text', ...props }) {
  const classes = ['input', className].filter(Boolean).join(' ')

  return <input type={type} data-slot="input" className={classes} {...props} />
}

export { Input }
