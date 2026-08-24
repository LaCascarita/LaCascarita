import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import MediaSemana from './pages/MediaSemana'
import FinDeSemana from './pages/FinDeSemana'
import Dominical from './pages/Dominical'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/media-semana" element={<MediaSemana />} />
        <Route path="/fin-de-semana" element={<FinDeSemana />} />
        <Route path="/dominical" element={<Dominical />} />
      </Routes>
    </Router>
  )
}

export default App