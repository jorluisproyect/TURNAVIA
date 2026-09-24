export default function MasterLoading(){
  return <main className="master-route-loading" role="status" aria-live="polite" aria-busy="true">
    <div className="master-route-loading-card">
      <span className="tucita-loader" aria-hidden="true"/>
      <strong>Actualizando TUCITA…</strong>
      <span>Espera un momento. Estamos cargando los datos más recientes.</span>
    </div>
  </main>;
}
