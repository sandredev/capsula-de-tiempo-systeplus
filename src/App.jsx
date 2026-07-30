import { useState, useEffect } from 'react'
import logo from './assets/Syste+ logo horizontal.png'
import conferencia from './assets/conferencia.jpg'
import certificados from './assets/certificados.webp'
import picnic from './assets/picnic.jpg'
import InstagramIcon from './components/InstagramIcon'
import './App.css'
import supabase from './lib/supabase/client.js'

const initialForm = { estudiante: '', mensaje: '', imagen: null }

function App() {
  const [formData, setFormData] = useState(initialForm)
  const [submitted, setSubmitted] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [messages, setMessages] = useState([{ estudiante: 'Cargando...', mensaje: 'Cargando...', imagen_url: '' }])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFormData((prev) => ({ ...prev, imagen: file }))
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    let imagen_url = null

    if (formData.imagen) {
      const ext = formData.imagen.name.split('.').pop()
      const imagePath = `images/${Date.now()}.${ext}`
      const { error: imageError } = await supabase.storage.from('fotos').upload(imagePath, formData.imagen)
      if (imageError) {
        console.error('Error subiendo imagen:', imageError)
        return
      }
      const { data: urlData } = supabase.storage.from('fotos').getPublicUrl(imagePath)
      imagen_url = urlData.publicUrl
    }

    const { error: messageError } = await supabase.from('mensajes').insert([{
                                estudiante: formData.estudiante, 
                                mensaje: formData.mensaje, 
                                imagen_url: imagen_url}])
    if (messageError) {
      console.error('Error guardando mensaje:', messageError)
      return
    }
    setSubmitted(true)
    setFormData(initialForm)
    setPhotoPreview(null)
  } 

  useEffect(() => {
    supabase.from('mensajes').select('*').then(({ data, error }) => {
      if (error) {
        console.error('Error fetching messages:', error)
        return
      }
      if (data) setMessages(data)
    })

    const channel = supabase
      .channel('mensajes-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes' }, (payload) => {
        setMessages((prev) => [...prev, payload.new])
      })
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          console.warn('Realtime status:', status)
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img src={logo} alt="Syste+" />
          <p className="brand-tagline">Asociación de Estudiantes de Ingeniería de Sistemas</p>
        </div>
      </header>

      <main className="page">
        <section className="hero">
          <div className="hero-content">
            <p className="eyebrow">Cápsula de Tiempo Syste+</p>
            <h1 className="hero-title">Tu historia empieza hoy y también la recordarás mañana.</h1>
            <p className="hero-desc">
              Escribe un mensaje para tu futuro yo, de aquí a 3 a 5 años, y descubre cómo otros estudiantes
              están imaginando su camino en la Universidad del Magdalena.
            </p>

            <div className="steps-card">
              <p className="steps-label">Próximos pasos</p>
              <ul className="steps-list">
                <li>Comparte cómo te visualizas dentro de unos años.</li>
                <li>Sube una foto que represente tu identidad y tus metas.</li>
                <li>Forma parte de la cápsula de Syste+.</li>
              </ul>
            </div>

            <div className="hero-actions">
              <a className="btn btn-primary" href="#form-section">
                <svg className="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
                Escribir mi mensaje
              </a>
              <a className="btn btn-outline" href="#messages-section">
                <svg className="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Ver mensajes
              </a>
            </div>
          </div>
        </section>

        <section className="instagram-section">
          <div className="instagram-card">
            <div className="instagram-head">
              <InstagramIcon className="instagram-big-icon" />
              <p className="eyebrow">Red social</p>
            </div>
            <h2 className="instagram-title">Síguenos en Instagram</h2>
            <p className="instagram-desc">
              Conecta con Syste+ en Instagram y descubre eventos, proyectos y momentos de la vida
              estudiantil. ¡Te esperamos!
            </p>

            <div className="instagram-posts">
              <div className="insta-post">
                <img className="insta-post-img" src={conferencia} alt="Conferencia" />
                <p className="insta-post-caption">Charlas y eventos para estudiantes</p>
              </div>
              <div className="insta-post">
                <img className="insta-post-img" src={certificados} alt="Certificados" />
                <p className="insta-post-caption">Proyectos y logros de la comunidad</p>
              </div>
              <div className="insta-post">
                <img className="insta-post-img" src={picnic} alt="Picnic" />
                <p className="insta-post-caption">Vida universitaria y momentos Syste+</p>
              </div>
            </div>

            <a
              className="instagram-cta"
              href="https://www.instagram.com/systeplus/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram de Syste+"
            >
              <InstagramIcon />
              <span>Seguir en @systeplus</span>
            </a>
          </div>
        </section>

        <section id="form-section" className="form-wrapper">
          <div className="section-card form-card">
            <div className="section-header">
              <p className="eyebrow">Tu mensaje</p>
              <h2 className="section-title">Registra tu futuro</h2>
            </div>

            <form className="form" onSubmit={handleSubmit}>
              <label className="field">
                <span className="field-label">Tu nombre<span style={{ color: 'red' }}>*</span></span>
                <input
                  name="estudiante"
                  type="text"
                  placeholder="Ej. Ana Torres"
                  value={formData.estudiante}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="field">
                <span className="field-label">Tu mensaje<span style={{ color: 'red' }}>*</span></span>
                <textarea
                  name="mensaje"
                  placeholder="Describe cómo te ves en 3 a 5 años..."
                  value={formData.mensaje}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="field">
                <span className="field-label">Foto (opcional)</span>
                <input className="file-input" type="file" accept="image/*" onChange={handleFileChange} />
              </label>

              {photoPreview ? (
                <img className="photo-preview" src={photoPreview} alt="Vista previa" />
              ) : (
                <div className="photo-placeholder">Sube una foto que represente tu identidad y tus metas</div>
              )}

              <button className="btn btn-primary btn-block" type="submit">
                <svg className="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2 11 13" />
                  <path d="M22 2 15 22 11 13 2 9 22 2Z" />
                </svg>
                Guardar en la cápsula
              </button>

              {submitted && (
                <p className="feedback">¡Tu mensaje quedó listo para ser revisado por el equipo de Syste+!</p>
              )}
            </form>
          </div>
        </section>

        <section id="messages-section" className="content-grid">
          <div className="section-card">
            <div className="section-header">
              <p className="eyebrow">Mensajes compartidos</p>
              <h2 className="section-title">Lo que soñamos ser</h2>
            </div>
            <div className="message-grid">
              {messages.map((m, i) => (
                <article className="message-card" key={m.id || i}>
                  {m.imagen_url && <img className="post-img" src={m.imagen_url} alt="" />}
                  <div className="post-body">
                    <div className="message-author">
                      <div className="avatar">{m.estudiante.charAt(0)}</div>
                      <div>
                        <h3 className="message-name">{m.estudiante}</h3>
                      </div>
                    </div>
                    <p className="message-text">{m.mensaje}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="brand">
          <img src={logo} alt="Syste+" />
          <p className="brand-tagline">Hecho con identidad y futuro por Syste+</p>
        </div>
      </footer>
    </div>
  )
}

export default App
