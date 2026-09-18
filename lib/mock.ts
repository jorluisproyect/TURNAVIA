export const doctor = {
  name: "Dra. Sofía Mendoza",
  initials: "SM",
  specialty: "Cardiología",
  location: "Centro Médico Caracas · Consultorio 204",
  status: "Consultando normalmente",
  delay: 0,
};

export const appointments = [
  { time: "08:00", patient: "María González", status: "Atendido", tone: "ok" },
  { time: "08:30", patient: "Pedro Ruiz", status: "En consulta", tone: "ok" },
  { time: "09:00", patient: "Ana Torres", status: "Ya llegó", tone: "ok" },
  { time: "09:30", patient: "José Méndez", status: "En camino", tone: "warn" },
  { time: "10:00", patient: "Carmen López", status: "Confirmado", tone: "" },
  { time: "10:30", patient: "Disponible", status: "Libre", tone: "" },
];

export const clinicDoctors = [
  { name: "Dra. Sofía Mendoza", specialty: "Cardiología", patients: 10, status: "Consultando" },
  { name: "Dr. Carlos Rojas", specialty: "Traumatología", patients: 8, status: "Consultando" },
  { name: "Dra. Laura Méndez", specialty: "Pediatría", patients: 12, status: "Disponible" },
  { name: "Dr. Andrés Silva", specialty: "Medicina Interna", patients: 7, status: "Retrasado" },
];

export const timeSlots = ["08:00 AM","08:30 AM","09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM"];
