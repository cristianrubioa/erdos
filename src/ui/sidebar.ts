const toggleBtn = document.getElementById('panel-toggle') as HTMLButtonElement
const backdrop = document.getElementById('panel-backdrop') as HTMLDivElement

function setOpen(open: boolean) {
  document.body.classList.toggle('panel-open', open)
  toggleBtn.setAttribute('aria-expanded', String(open))
}

toggleBtn.addEventListener('click', () => {
  setOpen(!document.body.classList.contains('panel-open'))
})

backdrop.addEventListener('click', () => setOpen(false))

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setOpen(false)
})
