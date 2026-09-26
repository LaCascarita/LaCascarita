import LegalDoc from './LegalDoc'

const sections = [
  {
    heading: 'Términos y condiciones del servicio',
    paragraphs: [
      'Contenido de los términos y condiciones pendiente de capturar.',
      'Este documento se actualizará con el texto oficial de La Cascarita.'
    ]
  }
]

const Terminos = () => (
  <LegalDoc title="Términos y Condiciones del Servicio" sections={sections} />
)

export default Terminos
