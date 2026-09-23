export const PROVIDER_CATEGORIES:Record<string,string[]>={
  'Salud':['Médico','Odontología','Psicología','Fisioterapia','Nutrición','Veterinaria','Otro'],
  'Belleza':['Barbería','Peluquería','Manicurista','Cejas y pestañas','Maquillaje','Estética','Otro'],
  'Bienestar':['Spa','Masajes','Yoga','Pilates','Coach personal','Otro'],
  'Servicios profesionales':['Abogado','Contador','Consultor','Asesor','Arquitecto','Diseñador','Otro'],
  'Educación':['Profesor particular','Academia','Idiomas','Música','Baile','Otro'],
  'Automotriz':['Taller','Detailing','Autolavado','Cambio de aceite','Accesorios','Otro'],
  'Hogar y técnicos':['Electricista','Plomero','Aire acondicionado','Computación','Celulares','Limpieza','Otro'],
  'Mascotas':['Grooming','Paseador','Pet sitting','Entrenamiento','Hotel para mascotas','Otro'],
  'Deporte':['Entrenador personal','Cancha','Academia deportiva','Otro'],
  'Espacios y alquiler':['Coworking','Sala de reuniones','Consultorio por hora','Estudio de grabación','Otro'],
  'Eventos':['Fotografía','Wedding planner','Salón de fiesta','Catering','Alquiler de vestidos','Otro'],
  'Servicios 18+':['Servicio privado con reserva','Otro'],
  'Otro':['Otro servicio con citas']
};

export const COUNTRY_PHONE_CODES=[
  {country:'Venezuela',code:'+58'},{country:'Colombia',code:'+57'},{country:'Perú',code:'+51'},{country:'Ecuador',code:'+593'},
  {country:'Chile',code:'+56'},{country:'Argentina',code:'+54'},{country:'Uruguay',code:'+598'},{country:'Paraguay',code:'+595'},
  {country:'Bolivia',code:'+591'},{country:'Brasil',code:'+55'},{country:'Panamá',code:'+507'},{country:'Costa Rica',code:'+506'},
  {country:'Nicaragua',code:'+505'},{country:'Honduras',code:'+504'},{country:'El Salvador',code:'+503'},{country:'Guatemala',code:'+502'},
  {country:'Belice',code:'+501'},{country:'México',code:'+52'},{country:'Cuba',code:'+53'},{country:'República Dominicana',code:'+1'},
  {country:'Puerto Rico',code:'+1'},{country:'Jamaica',code:'+1'},{country:'Trinidad y Tobago',code:'+1'},{country:'Bahamas',code:'+1'},
  {country:'Barbados',code:'+1'},{country:'Estados Unidos',code:'+1'},{country:'Canadá',code:'+1'},
  {country:'España',code:'+34'},{country:'Portugal',code:'+351'},{country:'Francia',code:'+33'},{country:'Italia',code:'+39'},
  {country:'Alemania',code:'+49'},{country:'Reino Unido',code:'+44'},{country:'Irlanda',code:'+353'},{country:'Países Bajos',code:'+31'},
  {country:'Bélgica',code:'+32'},{country:'Suiza',code:'+41'},{country:'Austria',code:'+43'},{country:'Suecia',code:'+46'},
  {country:'Noruega',code:'+47'},{country:'Dinamarca',code:'+45'},{country:'Finlandia',code:'+358'},{country:'Polonia',code:'+48'},
  {country:'República Checa',code:'+420'},{country:'Grecia',code:'+30'},{country:'Rumania',code:'+40'},{country:'Hungría',code:'+36'},
  {country:'Ucrania',code:'+380'},{country:'Croacia',code:'+385'},{country:'Serbia',code:'+381'},{country:'Turquía',code:'+90'},
  {country:'Israel',code:'+972'},{country:'Emiratos Árabes Unidos',code:'+971'},{country:'Arabia Saudita',code:'+966'},{country:'Qatar',code:'+974'},
  {country:'India',code:'+91'},{country:'Pakistán',code:'+92'},{country:'Bangladés',code:'+880'},{country:'China',code:'+86'},
  {country:'Japón',code:'+81'},{country:'Corea del Sur',code:'+82'},{country:'Singapur',code:'+65'},{country:'Tailandia',code:'+66'},
  {country:'Filipinas',code:'+63'},{country:'Indonesia',code:'+62'},{country:'Malasia',code:'+60'},{country:'Vietnam',code:'+84'},
  {country:'Australia',code:'+61'},{country:'Nueva Zelanda',code:'+64'},
  {country:'Sudáfrica',code:'+27'},{country:'Nigeria',code:'+234'},{country:'Kenia',code:'+254'},{country:'Ghana',code:'+233'},
  {country:'Marruecos',code:'+212'},{country:'Egipto',code:'+20'}
] as const;

export const COUNTRY_SUGGESTIONS=COUNTRY_PHONE_CODES.map(x=>x.country);
