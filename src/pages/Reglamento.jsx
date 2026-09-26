import LegalDoc from './LegalDoc'

const sections = [
  {
    heading: 'Reglamento general',
    paragraphs: [
      'Contenido del reglamento pendiente de capturar.',
      'Este documento se actualizará con el texto oficial de La Cascarita.'
    ]
  }
]

const Reglamento = () => (
  <LegalDoc title="Reglamento de La Cascarita" sections={sections} />
)

export default Reglamento
