import './button.css'

const VARIANT_CLASS_NAMES = {
  default: 'button--default',
  ghost: 'button--ghost',
  outline: 'button--outline',
}

const SIZE_CLASS_NAMES = {
  default: 'button--size-default',
  icon: 'button--size-icon',
}

function Button({
  className = '',
  variant = 'default',
  size = 'default',
  type = 'button',
  ...props
}) {
  const classes = [
    'button',
    VARIANT_CLASS_NAMES[variant] || VARIANT_CLASS_NAMES.default,
    SIZE_CLASS_NAMES[size] || SIZE_CLASS_NAMES.default,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <button type={type} data-slot="button" className={classes} {...props} />
}

export { Button }
