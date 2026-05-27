import { useState, useCallback } from 'react'
import Landing          from './screens/Landing'
import Encuesta         from './screens/Encuesta'
import Loading          from './screens/Loading'
import Condiciones      from './screens/Condiciones'
import Recomendaciones  from './screens/Recomendaciones'
import Precios          from './screens/Precios'
import Feedback         from './screens/Feedback'

const SCREENS = {
  landing:         Landing,
  encuesta:        Encuesta,
  loading:         Loading,
  condiciones:     Condiciones,
  recomendaciones: Recomendaciones,
  precios:         Precios,
  feedback:        Feedback,
}

export default function App() {
  const [screen,      setScreen]      = useState('landing')
  const [toast,       setToast]       = useState(null)
  const [userData,    setUserData]    = useState(null)
  const [apiResult,   setApiResult]   = useState(null)
  const [selectedRec, setSelectedRec] = useState(null)

  const goTo = useCallback((s) => setScreen(s), [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2700)
  }

  const Screen = SCREENS[screen]

  return (
    <div className="phone">
      <Screen
        key={screen}
        goTo={goTo}
        showToast={showToast}
        userData={userData}
        setUserData={setUserData}
        apiResult={apiResult}
        setApiResult={setApiResult}
        selectedRec={selectedRec}
        setSelectedRec={setSelectedRec}
      />
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
