BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "comunidades" (
	"id"	INTEGER,
	"territorio_id"	INTEGER NOT NULL,
	"puesto_salud_id"	INTEGER,
	"nombre"	TEXT NOT NULL,
	"codigo_comunidad"	TEXT UNIQUE,
	"latitud"	DECIMAL(10, 8),
	"longitud"	DECIMAL(11, 8),
	"poblacion_total"	INTEGER DEFAULT 0,
	"poblacion_mef"	INTEGER DEFAULT 0,
	"acceso_vehicular"	BOOLEAN DEFAULT 1,
	"distancia_km"	DECIMAL(6, 2),
	"activa"	BOOLEAN DEFAULT 1,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("puesto_salud_id") REFERENCES "puestos_salud"("id"),
	FOREIGN KEY("territorio_id") REFERENCES "territorios"("id")
);
CREATE TABLE IF NOT EXISTS "configuracion_metas_anuales" (
	"id"	INTEGER,
	"año"	INTEGER NOT NULL,
	"metodo_id"	INTEGER NOT NULL,
	"porcentaje_meta"	DECIMAL(5, 2) NOT NULL,
	"observaciones"	TEXT,
	"fecha_aprobacion"	DATE,
	"aprobado_por"	INTEGER,
	"activo"	BOOLEAN DEFAULT 1,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	UNIQUE("año","metodo_id"),
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("aprobado_por") REFERENCES "usuarios"("id"),
	FOREIGN KEY("metodo_id") REFERENCES "metodos_planificacion"("id")
);
CREATE TABLE IF NOT EXISTS "departamentos" (
	"id"	INTEGER,
	"nombre"	TEXT NOT NULL,
	"codigo_ine"	TEXT UNIQUE,
	"activo"	BOOLEAN DEFAULT 1,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "distritos_salud" (
	"id"	INTEGER,
	"municipio_id"	INTEGER NOT NULL,
	"nombre"	TEXT NOT NULL,
	"codigo"	TEXT UNIQUE,
	"direccion"	TEXT,
	"telefono"	TEXT,
	"activo"	BOOLEAN DEFAULT 1,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("municipio_id") REFERENCES "municipios"("id")
);
CREATE TABLE IF NOT EXISTS "metas_metodo_comunidad" (
	"id"	INTEGER,
	"proyeccion_id"	INTEGER NOT NULL,
	"metodo_id"	INTEGER NOT NULL,
	"año"	INTEGER NOT NULL,
	"porcentaje_metodo"	DECIMAL(5, 2) NOT NULL,
	"proyeccion_anual_metodo"	INTEGER NOT NULL,
	"observaciones"	TEXT,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"activo"	BOOLEAN DEFAULT 1,
	PRIMARY KEY("id" AUTOINCREMENT),
	UNIQUE("proyeccion_id","metodo_id","año"),
	FOREIGN KEY("metodo_id") REFERENCES "metodos_planificacion"("id"),
	FOREIGN KEY("proyeccion_id") REFERENCES "proyecciones_comunidad"("id")
);
CREATE TABLE IF NOT EXISTS "metodos_planificacion" (
	"id"	INTEGER,
	"codigo_metodo"	TEXT NOT NULL UNIQUE,
	"nombre"	TEXT NOT NULL,
	"nombre_corto"	TEXT,
	"categoria"	TEXT NOT NULL,
	"tipo_administracion"	TEXT,
	"unidad_medida"	TEXT DEFAULT 'unidades',
	"dias_efectividad"	INTEGER,
	"requiere_seguimiento"	BOOLEAN DEFAULT 0,
	"orden_visualizacion"	INTEGER DEFAULT 0,
	"activo"	BOOLEAN DEFAULT 1,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "municipios" (
	"id"	INTEGER,
	"departamento_id"	INTEGER NOT NULL,
	"nombre"	TEXT NOT NULL,
	"codigo_ine"	TEXT UNIQUE,
	"activo"	BOOLEAN DEFAULT 1,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("departamento_id") REFERENCES "departamentos"("id")
);
CREATE TABLE IF NOT EXISTS "permisos_comunidad" (
	"id"	INTEGER,
	"usuario_id"	INTEGER NOT NULL,
	"comunidad_id"	INTEGER NOT NULL,
	"puede_ver"	BOOLEAN DEFAULT 1,
	"puede_registrar"	BOOLEAN DEFAULT 0,
	"puede_editar"	BOOLEAN DEFAULT 0,
	"fecha_asignacion"	DATE DEFAULT CURRENT_DATE,
	"activo"	BOOLEAN DEFAULT 1,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT),
	UNIQUE("usuario_id","comunidad_id"),
	FOREIGN KEY("comunidad_id") REFERENCES "comunidades"("id"),
	FOREIGN KEY("usuario_id") REFERENCES "usuarios"("id")
);
CREATE TABLE IF NOT EXISTS "planificacion_mensual" (
	"id"	INTEGER,
	"meta_metodo_comunidad_id"	INTEGER NOT NULL,
	"mes"	INTEGER NOT NULL CHECK("mes" >= 1 AND "mes" <= 12),
	"meta_mensual"	INTEGER DEFAULT 0,
	"observaciones"	TEXT,
	"fecha_creacion"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"creado_por"	INTEGER,
	"activo"	BOOLEAN DEFAULT 1,
	PRIMARY KEY("id" AUTOINCREMENT),
	UNIQUE("meta_metodo_comunidad_id","mes"),
	FOREIGN KEY("creado_por") REFERENCES "usuarios"("id"),
	FOREIGN KEY("meta_metodo_comunidad_id") REFERENCES "metas_metodo_comunidad"("id")
);
CREATE TABLE IF NOT EXISTS "proyecciones_comunidad" (
	"id"	INTEGER,
	"comunidad_id"	INTEGER NOT NULL,
	"año"	INTEGER NOT NULL,
	"poblacion_mef"	INTEGER NOT NULL,
	"porcentaje_proyeccion"	REAL DEFAULT 0.35,
	"ajuste_fijo"	INTEGER DEFAULT 70,
	"proyeccion_anual"	INTEGER GENERATED ALWAYS AS (CAST(("poblacion_mef" * "porcentaje_proyeccion") - "ajuste_fijo" AS INTEGER)) STORED,
	"observaciones"	TEXT,
	"fecha_configuracion"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"configurado_por"	INTEGER,
	"activo"	BOOLEAN DEFAULT 1,
	"proyeccion_manual"	INTEGER,
	"es_manual"	BOOLEAN DEFAULT 0,
	"unidades_sin_distribuir"	INTEGER DEFAULT 0,
	UNIQUE("comunidad_id","año"),
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("comunidad_id") REFERENCES "comunidades"("id"),
	FOREIGN KEY("configurado_por") REFERENCES "usuarios"("id")
);
CREATE TABLE IF NOT EXISTS "puestos_salud" (
	"id"	INTEGER,
	"territorio_id"	INTEGER NOT NULL,
	"nombre"	TEXT NOT NULL,
	"tipo"	TEXT NOT NULL CHECK("tipo" IN ('centro_salud', 'puesto_salud', 'centro_comunitario', 'sede_sector', 'sede_territorio')),
	"codigo"	TEXT UNIQUE,
	"direccion"	TEXT,
	"activo"	BOOLEAN DEFAULT 1,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("territorio_id") REFERENCES "territorios"("id")
);
CREATE TABLE IF NOT EXISTS "registros_historicos" (
	"id"	INTEGER,
	"comunidad_id"	INTEGER NOT NULL,
	"metodo_id"	INTEGER NOT NULL,
	"año"	INTEGER NOT NULL,
	"mes"	INTEGER NOT NULL,
	"cantidad_administrada"	INTEGER NOT NULL DEFAULT 0,
	"fecha_registro"	DATE NOT NULL,
	"observaciones"	TEXT,
	"estado"	TEXT DEFAULT 'registrado',
	"registrado_por"	INTEGER NOT NULL,
	"migrado_desde_v1"	BOOLEAN DEFAULT 1,
	"fecha_migracion"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("comunidad_id") REFERENCES "comunidades"("id"),
	FOREIGN KEY("metodo_id") REFERENCES "metodos_planificacion"("id"),
	FOREIGN KEY("registrado_por") REFERENCES "usuarios"("id")
);
CREATE TABLE IF NOT EXISTS "roles" (
	"id"	INTEGER,
	"codigo_rol"	TEXT NOT NULL UNIQUE,
	"nombre"	TEXT NOT NULL,
	"descripcion"	TEXT,
	"nivel_jerarquico"	INTEGER NOT NULL,
	"puede_registrar"	BOOLEAN DEFAULT 0,
	"puede_validar"	BOOLEAN DEFAULT 0,
	"puede_aprobar"	BOOLEAN DEFAULT 0,
	"puede_generar_reportes"	BOOLEAN DEFAULT 0,
	"puede_administrar"	BOOLEAN DEFAULT 0,
	"activo"	BOOLEAN DEFAULT 1,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "territorios" (
	"id"	INTEGER,
	"distrito_id"	INTEGER NOT NULL,
	"nombre"	TEXT NOT NULL,
	"codigo"	TEXT UNIQUE,
	"descripcion"	TEXT,
	"activo"	BOOLEAN DEFAULT 1,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("distrito_id") REFERENCES "distritos_salud"("id")
);
CREATE TABLE IF NOT EXISTS "user_territorios" (
	"id"	INTEGER,
	"usuario_id"	INTEGER NOT NULL,
	"territorio_id"	INTEGER NOT NULL,
	"asignado_por"	INTEGER,
	"fecha_asignacion"	DATE DEFAULT CURRENT_DATE,
	"activo"	BOOLEAN DEFAULT 1,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT),
	UNIQUE("usuario_id","territorio_id"),
	FOREIGN KEY("asignado_por") REFERENCES "usuarios"("id"),
	FOREIGN KEY("territorio_id") REFERENCES "territorios"("id"),
	FOREIGN KEY("usuario_id") REFERENCES "usuarios"("id")
);
CREATE TABLE IF NOT EXISTS "usuarias" (
	"id"	INTEGER,
	"dpi"	TEXT NOT NULL UNIQUE,
	"nombres"	TEXT NOT NULL,
	"apellidos"	TEXT NOT NULL,
	"comunidad_id"	INTEGER NOT NULL,
	"fecha_nacimiento"	DATE,
	"telefono"	TEXT,
	"tipo_usuaria"	TEXT DEFAULT 'nueva' CHECK("tipo_usuaria" IN ('nueva', 'reconsulta', 'activa')),
	"fecha_primera_visita"	DATE NOT NULL,
	"fecha_ultima_visita"	DATE,
	"total_visitas"	INTEGER DEFAULT 1,
	"activa"	BOOLEAN DEFAULT 1,
	"observaciones"	TEXT,
	"creada_por"	INTEGER NOT NULL,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"updated_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("comunidad_id") REFERENCES "comunidades"("id"),
	FOREIGN KEY("creada_por") REFERENCES "usuarios"("id")
);
CREATE TABLE IF NOT EXISTS "usuarios" (
	"id"	INTEGER,
	"codigo_empleado"	TEXT UNIQUE,
	"dpi"	TEXT UNIQUE,
	"nombres"	TEXT NOT NULL,
	"apellidos"	TEXT NOT NULL,
	"email"	TEXT NOT NULL UNIQUE,
	"telefono"	TEXT,
	"password_hash"	TEXT NOT NULL,
	"rol_id"	INTEGER NOT NULL,
	"territorio_id"	INTEGER,
	"distrito_id"	INTEGER,
	"cargo"	TEXT,
	"fecha_ingreso"	DATE,
	"ultimo_acceso"	DATETIME,
	"intentos_fallidos"	INTEGER DEFAULT 0,
	"bloqueado"	BOOLEAN DEFAULT 0,
	"debe_cambiar_password"	BOOLEAN DEFAULT 1,
	"activo"	BOOLEAN DEFAULT 1,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"updated_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("distrito_id") REFERENCES "distritos_salud"("id"),
	FOREIGN KEY("rol_id") REFERENCES "roles"("id"),
	FOREIGN KEY("territorio_id") REFERENCES "territorios"("id")
);
CREATE TABLE IF NOT EXISTS "visitas" (
	"id"	INTEGER,
	"usuaria_id"	INTEGER NOT NULL,
	"metodo_id"	INTEGER NOT NULL,
	"fecha_visita"	DATE NOT NULL,
	"observaciones"	TEXT,
	"estado"	TEXT DEFAULT 'registrado' CHECK("estado" IN ('registrado', 'validado', 'rechazado')),
	"registrado_por"	INTEGER NOT NULL,
	"fecha_hora_registro"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"validado_por"	INTEGER,
	"fecha_hora_validacion"	DATETIME,
	"observaciones_validacion"	TEXT,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"updated_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("metodo_id") REFERENCES "metodos_planificacion"("id"),
	FOREIGN KEY("registrado_por") REFERENCES "usuarios"("id"),
	FOREIGN KEY("usuaria_id") REFERENCES "usuarias"("id"),
	FOREIGN KEY("validado_por") REFERENCES "usuarios"("id")
);
INSERT INTO "comunidades" VALUES (1,1,NULL,'Minerva','T1-002',NULL,NULL,6720,1600,1,NULL,1,'2025-10-19 00:47:55');
INSERT INTO "comunidades" VALUES (2,2,NULL,'Zona 3 Calvario','T2-003',NULL,NULL,4830,1150,1,NULL,1,'2025-10-19 00:47:55');
INSERT INTO "comunidades" VALUES (3,1,NULL,'Los Aguacatillos','T1-003',NULL,NULL,4620,1100,1,NULL,1,'2025-10-19 00:47:55');
INSERT INTO "comunidades" VALUES (4,3,NULL,'Lo de Hernández','T3-001',NULL,NULL,5922,1410,1,NULL,1,'2025-10-19 00:47:55');
INSERT INTO "comunidades" VALUES (5,3,NULL,'El Eucalipto','T3-002',NULL,NULL,7140,1700,1,NULL,1,'2025-10-19 00:47:56');
INSERT INTO "comunidades" VALUES (6,5,NULL,'Llano Grande Chinaca','T5-004',NULL,NULL,1696,404,1,NULL,1,'2025-10-19 00:47:56');
INSERT INTO "comunidades" VALUES (7,5,NULL,'Chinaca','T5-001',NULL,NULL,9710,2312,1,NULL,1,'2025-10-19 00:47:56');
INSERT INTO "comunidades" VALUES (8,7,NULL,'La Laguna Chinaca','T7-006',NULL,NULL,924,220,1,NULL,1,'2025-10-19 00:47:56');
INSERT INTO "comunidades" VALUES (9,7,NULL,'La Laguna Ocubilá','T7-005',NULL,NULL,756,160,1,NULL,1,'2025-10-19 00:47:56');
INSERT INTO "comunidades" VALUES (10,7,NULL,'Lo de Chavez','T7-004',NULL,NULL,840,200,1,NULL,1,'2025-10-19 00:47:56');
INSERT INTO "comunidades" VALUES (11,7,NULL,'Borrar','Xxxx',NULL,NULL,630,150,1,NULL,1,'2025-10-19 00:47:56');
INSERT INTO "comunidades" VALUES (12,7,NULL,'Ocubilá','T7-003',NULL,NULL,3780,900,1,NULL,1,'2025-10-19 00:47:56');
INSERT INTO "comunidades" VALUES (13,7,NULL,'El Llano Ocubilá','T7-001',NULL,NULL,1470,350,1,NULL,1,'2025-10-19 00:47:56');
INSERT INTO "comunidades" VALUES (14,7,NULL,'La Barranca Ocubilá','T7-002',NULL,NULL,630,150,1,NULL,1,'2025-10-19 00:47:56');
INSERT INTO "comunidades" VALUES (15,7,NULL,'El Llano Chinaca','T7-007',NULL,NULL,1596,380,1,NULL,1,'2025-10-19 00:47:57');
INSERT INTO "comunidades" VALUES (16,5,NULL,'Posh','T5-002',NULL,NULL,777,185,1,NULL,1,'2025-10-19 00:47:58');
INSERT INTO "comunidades" VALUES (17,7,NULL,'Borrarrr','XXXXXXXXXXXX',NULL,NULL,840,200,1,NULL,1,'2025-10-19 00:47:58');
INSERT INTO "comunidades" VALUES (18,8,NULL,'Xetenam','T8-001',NULL,NULL,1419,338,1,NULL,1,'2025-10-19 00:47:58');
INSERT INTO "comunidades" VALUES (19,8,NULL,'La Barranca Xétenam','T8-002',NULL,NULL,378,90,1,NULL,1,'2025-10-19 00:47:58');
INSERT INTO "comunidades" VALUES (20,5,NULL,'Borrarr','XXXXXXXXXXX',NULL,NULL,546,130,1,NULL,1,'2025-10-19 00:47:58');
INSERT INTO "comunidades" VALUES (21,8,NULL,'Chiquilabaj','T8-004',NULL,NULL,357,85,1,NULL,1,'2025-10-19 00:47:58');
INSERT INTO "comunidades" VALUES (22,8,NULL,'Sunul','T8-005',NULL,NULL,1743,415,1,NULL,1,'2025-10-19 00:47:58');
INSERT INTO "comunidades" VALUES (23,8,NULL,'Cancelaj','T8-006',NULL,NULL,1617,385,1,NULL,1,'2025-10-19 00:47:59');
INSERT INTO "comunidades" VALUES (24,9,NULL,'Llano Grande La Estancia','T9-001',NULL,NULL,1402,334,1,NULL,1,'2025-10-19 00:47:59');
INSERT INTO "comunidades" VALUES (25,9,NULL,'Las Pilas','T9-002',NULL,NULL,420,100,1,NULL,1,'2025-10-19 00:47:59');
INSERT INTO "comunidades" VALUES (26,9,NULL,'El Valle','T9-003',NULL,NULL,840,200,1,NULL,1,'2025-10-19 00:47:59');
INSERT INTO "comunidades" VALUES (27,9,NULL,'El Orégano','T9-004',NULL,NULL,777,185,1,NULL,1,'2025-10-19 00:47:59');
INSERT INTO "comunidades" VALUES (28,9,NULL,'Río Negro','T9-005',NULL,NULL,651,155,1,NULL,1,'2025-10-19 00:47:59');
INSERT INTO "comunidades" VALUES (29,9,NULL,'Las Florecitas','T9-006',NULL,NULL,420,100,1,NULL,1,'2025-10-19 00:47:59');
INSERT INTO "comunidades" VALUES (30,9,NULL,'La Estancia','T9-007',NULL,NULL,1134,270,1,NULL,1,'2025-10-19 00:47:59');
INSERT INTO "comunidades" VALUES (31,9,NULL,'Sucuj','T9-008',NULL,NULL,520,124,1,NULL,1,'2025-10-19 00:47:59');
INSERT INTO "comunidades" VALUES (32,1,NULL,'Centro de Salud','T1-001',NULL,NULL,5880,1400,1,NULL,1,'2025-10-19 00:47:59');
INSERT INTO "comunidades" VALUES (33,5,NULL,'Tojespaque','T5-003',NULL,NULL,1927,469,1,NULL,1,'2025-10-19 00:48:00');
INSERT INTO "comunidades" VALUES (34,3,NULL,'Brasilia','T3-003',NULL,NULL,3780,900,1,NULL,1,'2025-10-19 00:48:00');
INSERT INTO "comunidades" VALUES (35,4,NULL,'Terrero Alto','T4-001',NULL,NULL,4494,1070,1,NULL,1,'2025-10-19 00:48:00');
INSERT INTO "comunidades" VALUES (36,4,NULL,'Terrero','T4-003',NULL,NULL,6636,1580,1,NULL,1,'2025-10-19 00:48:00');
INSERT INTO "comunidades" VALUES (37,7,NULL,'Eliminar','X',NULL,NULL,6636,1580,1,NULL,1,'2025-10-19 00:48:00');
INSERT INTO "comunidades" VALUES (38,7,NULL,'Elminar','XXXX',NULL,NULL,5880,1400,1,NULL,1,'2025-10-19 00:48:00');
INSERT INTO "comunidades" VALUES (39,4,NULL,'Terrero Bajo','T4-002',NULL,NULL,6300,1500,1,NULL,1,'2025-10-19 00:48:00');
INSERT INTO "comunidades" VALUES (40,2,NULL,'Carrizal I','T2-002',NULL,NULL,4410,1050,1,NULL,1,'2025-10-19 00:48:00');
INSERT INTO "comunidades" VALUES (41,2,NULL,'Carrizal Arriba','T2-004',NULL,NULL,4200,1000,1,NULL,1,'2025-10-19 00:48:01');
INSERT INTO "comunidades" VALUES (42,6,NULL,'San Lorenzo','T6-001',NULL,NULL,6300,1500,1,NULL,1,'2025-10-19 00:48:01');
INSERT INTO "comunidades" VALUES (43,6,NULL,'Ojechejel','T6-002',NULL,NULL,1932,460,1,NULL,1,'2025-10-19 00:48:01');
INSERT INTO "comunidades" VALUES (44,6,NULL,'Tojocaz','T6-003',NULL,NULL,2100,500,1,NULL,1,'2025-10-19 00:48:01');
INSERT INTO "comunidades" VALUES (45,6,NULL,'Chilojá','T6-004',NULL,NULL,1260,300,1,NULL,1,'2025-10-19 00:48:01');
INSERT INTO "comunidades" VALUES (46,6,NULL,'Monte Verde','T6-005',NULL,NULL,5670,1350,1,NULL,1,'2025-10-19 00:48:01');
INSERT INTO "comunidades" VALUES (47,6,NULL,'Jumaj','T6-006',NULL,NULL,5040,1200,1,NULL,1,'2025-10-19 00:48:01');
INSERT INTO "comunidades" VALUES (48,8,NULL,'Buena Vista','T8-003',NULL,NULL,546,130,1,NULL,1,'2025-10-19 00:48:01');
INSERT INTO "comunidades" VALUES (49,2,NULL,'Carrizal II','T2-001',NULL,NULL,4620,1100,1,NULL,1,'2025-10-19 00:48:01');
INSERT INTO "comunidades" VALUES (50,8,NULL,'Quiaquixac','T8-007',NULL,NULL,550,58,1,NULL,1,'2025-10-19 00:48:02');
INSERT INTO "configuracion_metas_anuales" VALUES (1,2025,1,10,NULL,'2025-10-24',1,1,'2025-10-19 00:48:05');
INSERT INTO "configuracion_metas_anuales" VALUES (2,2025,2,10,NULL,'2025-10-24',1,1,'2025-10-19 00:48:05');
INSERT INTO "configuracion_metas_anuales" VALUES (3,2025,3,8,NULL,'2025-10-24',1,1,'2025-10-19 00:48:05');
INSERT INTO "configuracion_metas_anuales" VALUES (4,2025,7,0.5,NULL,'2025-10-24',1,1,'2025-10-19 00:48:06');
INSERT INTO "configuracion_metas_anuales" VALUES (5,2025,8,0.5,NULL,'2025-10-24',1,1,'2025-10-19 00:48:06');
INSERT INTO "configuracion_metas_anuales" VALUES (6,2025,9,2,NULL,'2025-10-24',1,1,'2025-10-19 00:48:06');
INSERT INTO "configuracion_metas_anuales" VALUES (7,2025,6,5,NULL,'2025-10-24',1,1,'2025-10-19 00:48:06');
INSERT INTO "configuracion_metas_anuales" VALUES (8,2025,11,12,NULL,'2025-10-24',1,1,'2025-10-19 00:48:06');
INSERT INTO "configuracion_metas_anuales" VALUES (9,2025,5,1,NULL,'2025-10-24',1,1,'2025-10-19 00:48:06');
INSERT INTO "configuracion_metas_anuales" VALUES (10,2025,10,45,NULL,'2025-10-24',1,1,'2025-10-19 00:48:06');
INSERT INTO "configuracion_metas_anuales" VALUES (11,2025,4,6,NULL,'2025-10-24',1,1,'2025-10-19 00:48:06');
INSERT INTO "departamentos" VALUES (1,'Huehuetenango','13',1,'2025-10-19 00:47:54');
INSERT INTO "distritos_salud" VALUES (1,1,'Centro de Salud - Huehuetenango','HUE-DS-01','Huehuetenango, Guatemala',NULL,1,'2025-10-19 00:47:54');
INSERT INTO "metas_metodo_comunidad" VALUES (1,1,1,2025,10,49,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (2,2,1,2025,10,33,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (3,6,1,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (4,10,1,2025,10,5,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (5,7,1,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (6,12,1,2025,10,42,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (7,4,1,2025,10,73,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (8,14,1,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (9,9,1,2025,10,24,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (10,16,1,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (11,11,1,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (12,18,1,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (13,13,1,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (14,20,1,2025,10,6,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (15,15,1,2025,10,4,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (16,22,1,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (17,17,1,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (18,24,1,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (19,19,1,2025,10,7,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (20,26,1,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (21,21,1,2025,10,52,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (22,28,1,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (23,23,1,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (24,30,1,2025,10,9,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (25,25,1,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (26,32,1,2025,10,30,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (27,27,1,2025,10,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (28,34,1,2025,10,48,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (29,29,1,2025,10,41,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (30,36,1,2025,10,45,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (31,31,1,2025,10,24,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (32,37,1,2025,10,29,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (33,38,1,2025,10,28,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (34,39,1,2025,10,45,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (35,40,1,2025,10,9,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (36,41,1,2025,10,10,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (37,42,1,2025,10,3,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (38,33,1,2025,10,48,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (39,44,1,2025,10,35,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (40,45,1,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (41,46,1,2025,10,31,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (42,48,1,2025,10,6,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (43,43,1,2025,10,40,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (44,50,1,2025,10,31,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (45,5,1,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (46,35,1,2025,10,41,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (47,3,1,2025,10,7,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (48,47,1,2025,10,33,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (49,8,1,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (50,49,1,2025,10,4,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (51,1,2,2025,10,49,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (52,2,2,2025,10,33,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (53,7,2,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (54,6,2,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (55,4,2,2025,10,73,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (56,14,2,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (57,9,2,2025,10,24,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (58,16,2,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (59,11,2,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (60,18,2,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (61,13,2,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (62,20,2,2025,10,6,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (63,15,2,2025,10,4,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (64,22,2,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (65,17,2,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (66,10,2,2025,10,5,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (67,26,2,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (68,12,2,2025,10,42,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (69,28,2,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (70,24,2,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (71,30,2,2025,10,9,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (72,19,2,2025,10,7,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (73,25,2,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (74,32,2,2025,10,30,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (75,27,2,2025,10,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (76,34,2,2025,10,48,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (77,29,2,2025,10,41,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (78,23,2,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (79,37,2,2025,10,29,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (80,21,2,2025,10,52,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (81,39,2,2025,10,45,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (82,40,2,2025,10,9,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (83,36,2,2025,10,45,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (84,42,2,2025,10,3,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (85,31,2,2025,10,24,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (86,33,2,2025,10,48,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (87,44,2,2025,10,35,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (88,45,2,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (89,46,2,2025,10,31,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (90,41,2,2025,10,10,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (91,50,2,2025,10,31,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (92,38,2,2025,10,28,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (93,35,2,2025,10,41,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (94,48,2,2025,10,6,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (95,3,2,2025,10,7,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (96,47,2,2025,10,33,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (97,43,2,2025,10,40,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (98,5,2,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (99,8,2,2025,10,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (100,49,2,2025,10,4,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (101,1,10,2025,45,220,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (102,2,10,2025,45,149,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (103,7,10,2025,45,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (104,14,10,2025,45,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (105,16,10,2025,45,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (106,4,10,2025,45,332,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (107,18,10,2025,45,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (108,9,10,2025,45,110,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (109,20,10,2025,45,28,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (110,15,10,2025,45,21,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (111,6,10,2025,45,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (112,17,10,2025,45,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (113,11,10,2025,45,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (114,26,10,2025,45,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (115,12,10,2025,45,190,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (116,13,10,2025,45,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (117,28,10,2025,45,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (118,24,10,2025,45,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (119,22,10,2025,45,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (120,19,10,2025,45,33,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (121,25,10,2025,45,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (122,32,10,2025,45,136,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (123,27,10,2025,45,10,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (124,34,10,2025,45,217,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (125,29,10,2025,45,188,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (126,10,10,2025,45,23,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (127,21,10,2025,45,236,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (128,30,10,2025,45,40,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (129,40,10,2025,45,40,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (130,36,10,2025,45,204,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (131,42,10,2025,45,15,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (132,23,10,2025,45,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (133,33,10,2025,45,217,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (134,37,10,2025,45,133,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (135,45,10,2025,45,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (136,39,10,2025,45,204,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (137,41,10,2025,45,47,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (138,50,10,2025,45,141,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (139,31,10,2025,45,110,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (140,38,10,2025,45,126,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (141,35,10,2025,45,188,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (142,44,10,2025,45,157,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (143,47,10,2025,45,149,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (144,46,10,2025,45,141,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (145,43,10,2025,45,180,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (146,5,10,2025,45,3,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (147,48,10,2025,45,28,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (148,8,10,2025,45,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (149,49,10,2025,45,20,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (150,3,10,2025,45,31,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (151,1,11,2025,12,58,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (152,7,11,2025,12,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (153,4,11,2025,12,88,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (154,16,11,2025,12,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (155,18,11,2025,12,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (156,9,11,2025,12,29,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (157,20,11,2025,12,7,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (158,15,11,2025,12,5,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (159,6,11,2025,12,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (160,2,11,2025,12,39,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (161,26,11,2025,12,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (162,14,11,2025,12,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (163,13,11,2025,12,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (164,17,11,2025,12,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (165,28,11,2025,12,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (166,24,11,2025,12,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (167,11,11,2025,12,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (168,19,11,2025,12,9,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (169,25,11,2025,12,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (170,32,11,2025,12,36,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (171,27,11,2025,12,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (172,34,11,2025,12,57,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (173,29,11,2025,12,50,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (174,10,11,2025,12,6,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (175,21,11,2025,12,63,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (176,30,11,2025,12,10,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (177,40,11,2025,12,10,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (178,36,11,2025,12,54,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (179,22,11,2025,12,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (180,33,11,2025,12,57,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (181,12,11,2025,12,50,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (182,45,11,2025,12,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (183,42,11,2025,12,4,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (184,39,11,2025,12,54,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (185,41,11,2025,12,12,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (186,50,11,2025,12,37,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (187,31,11,2025,12,29,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (188,38,11,2025,12,33,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (189,37,11,2025,12,35,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (190,47,11,2025,12,39,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (191,23,11,2025,12,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (192,46,11,2025,12,37,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (193,43,11,2025,12,48,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (194,35,11,2025,12,50,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (195,48,11,2025,12,7,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (196,44,11,2025,12,42,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (197,49,11,2025,12,5,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (198,3,11,2025,12,8,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (199,5,11,2025,12,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (200,8,11,2025,12,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (201,1,9,2025,2,9,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (202,7,9,2025,2,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (203,4,9,2025,2,14,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (204,16,9,2025,2,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (205,18,9,2025,2,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (206,15,9,2025,2,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (207,6,9,2025,2,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (208,2,9,2025,2,6,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (209,26,9,2025,2,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (210,14,9,2025,2,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (211,9,9,2025,2,4,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (212,17,9,2025,2,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (213,28,9,2025,2,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (214,24,9,2025,2,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (215,11,9,2025,2,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (216,19,9,2025,2,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (217,25,9,2025,2,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (218,13,9,2025,2,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (219,34,9,2025,2,9,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (220,29,9,2025,2,8,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (221,20,9,2025,2,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (222,10,9,2025,2,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (223,21,9,2025,2,10,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (224,30,9,2025,2,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (225,40,9,2025,2,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (226,32,9,2025,2,6,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (227,33,9,2025,2,9,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (228,12,9,2025,2,8,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (229,27,9,2025,2,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (230,45,9,2025,2,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (231,42,9,2025,2,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (232,39,9,2025,2,9,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (233,36,9,2025,2,9,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (234,50,9,2025,2,6,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (235,31,9,2025,2,4,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (236,38,9,2025,2,5,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (237,37,9,2025,2,5,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (238,47,9,2025,2,6,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (239,23,9,2025,2,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (240,46,9,2025,2,6,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (241,43,9,2025,2,8,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (242,35,9,2025,2,8,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (243,44,9,2025,2,7,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (244,22,9,2025,2,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (245,49,9,2025,2,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (246,3,9,2025,2,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (247,41,9,2025,2,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (248,5,9,2025,2,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (249,8,9,2025,2,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (250,48,9,2025,2,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (251,1,3,2025,8,39,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (252,7,3,2025,8,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (253,4,3,2025,8,59,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (254,16,3,2025,8,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (255,2,3,2025,8,26,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (256,18,3,2025,8,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (257,26,3,2025,8,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (258,14,3,2025,8,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (259,9,3,2025,8,19,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (260,17,3,2025,8,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (261,28,3,2025,8,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (262,24,3,2025,8,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (263,11,3,2025,8,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (264,19,3,2025,8,6,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (265,15,3,2025,8,3,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (266,13,3,2025,8,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (267,34,3,2025,8,38,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (268,6,3,2025,8,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (269,10,3,2025,8,4,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (270,25,3,2025,8,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (271,21,3,2025,8,42,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (272,30,3,2025,8,7,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (273,29,3,2025,8,33,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (274,32,3,2025,8,24,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (275,33,3,2025,8,38,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (276,12,3,2025,8,33,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (277,27,3,2025,8,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (278,45,3,2025,8,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (279,40,3,2025,8,7,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (280,36,3,2025,8,36,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (281,20,3,2025,8,5,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (282,31,3,2025,8,19,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (283,42,3,2025,8,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (284,37,3,2025,8,23,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (285,39,3,2025,8,36,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (286,47,3,2025,8,26,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (287,23,3,2025,8,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (288,43,3,2025,8,32,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (289,38,3,2025,8,22,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (290,35,3,2025,8,33,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (291,44,3,2025,8,28,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (292,46,3,2025,8,25,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (293,49,3,2025,8,3,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (294,3,3,2025,8,5,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (295,41,3,2025,8,8,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (296,5,3,2025,8,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (297,22,3,2025,8,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (298,8,3,2025,8,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (299,50,3,2025,8,25,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (300,48,3,2025,8,5,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (301,7,4,2025,6,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (302,1,4,2025,6,29,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (303,4,4,2025,6,44,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (304,16,4,2025,6,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (305,2,4,2025,6,19,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (306,26,4,2025,6,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (307,17,4,2025,6,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (308,28,4,2025,6,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (309,14,4,2025,6,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (310,11,4,2025,6,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (311,9,4,2025,6,14,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (312,19,4,2025,6,4,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (313,15,4,2025,6,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (314,18,4,2025,6,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (315,6,4,2025,6,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (316,24,4,2025,6,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (317,10,4,2025,6,3,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (318,25,4,2025,6,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (319,21,4,2025,6,31,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (320,30,4,2025,6,5,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (321,29,4,2025,6,25,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (322,32,4,2025,6,18,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (323,33,4,2025,6,28,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (324,12,4,2025,6,25,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (325,27,4,2025,6,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (326,45,4,2025,6,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (327,13,4,2025,6,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (328,36,4,2025,6,27,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (329,20,4,2025,6,3,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (330,34,4,2025,6,28,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (331,37,4,2025,6,17,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (332,40,4,2025,6,5,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (333,47,4,2025,6,19,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (334,31,4,2025,6,14,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (335,43,4,2025,6,24,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (336,42,4,2025,6,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (337,35,4,2025,6,25,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (338,39,4,2025,6,27,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (339,46,4,2025,6,18,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (340,23,4,2025,6,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (341,49,4,2025,6,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (342,38,4,2025,6,16,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (343,5,4,2025,6,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (344,44,4,2025,6,21,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (345,22,4,2025,6,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (346,8,4,2025,6,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (347,3,4,2025,6,4,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (348,41,4,2025,6,6,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (349,50,4,2025,6,18,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (350,48,4,2025,6,3,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (351,4,5,2025,1,7,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (352,1,5,2025,1,4,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (353,7,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (354,16,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (355,2,5,2025,1,3,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (356,17,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (357,14,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (358,11,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (359,9,5,2025,1,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (360,19,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (361,15,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (362,18,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (363,26,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (364,10,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (365,28,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (366,25,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (367,21,5,2025,1,5,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (368,30,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (369,29,5,2025,1,4,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (370,6,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (371,33,5,2025,1,4,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (372,12,5,2025,1,4,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (373,27,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (374,24,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (375,13,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (376,36,5,2025,1,4,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (377,32,5,2025,1,3,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (378,34,5,2025,1,4,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (379,37,5,2025,1,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (380,40,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (381,31,5,2025,1,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (382,20,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (383,43,5,2025,1,4,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (384,42,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (385,47,5,2025,1,3,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (386,39,5,2025,1,4,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (387,45,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (388,49,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (389,35,5,2025,1,4,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (390,5,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (391,46,5,2025,1,3,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (392,22,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (393,23,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (394,3,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (395,38,5,2025,1,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (396,41,5,2025,1,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (397,50,5,2025,1,3,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (398,8,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (399,44,5,2025,1,3,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (400,48,5,2025,1,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (401,4,6,2025,5,36,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (402,7,6,2025,5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (403,1,6,2025,5,24,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (404,16,6,2025,5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (405,2,6,2025,5,16,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (406,17,6,2025,5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (407,11,6,2025,5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (408,19,6,2025,5,3,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (409,15,6,2025,5,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (410,18,6,2025,5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (411,26,6,2025,5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (412,10,6,2025,5,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (413,9,6,2025,5,12,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (414,25,6,2025,5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (415,21,6,2025,5,26,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (416,14,6,2025,5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (417,29,6,2025,5,20,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (418,6,6,2025,5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (419,28,6,2025,5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (420,12,6,2025,5,21,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (421,27,6,2025,5,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (422,24,6,2025,5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (423,13,6,2025,5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (424,30,6,2025,5,4,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (425,32,6,2025,5,15,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (426,34,6,2025,5,24,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (427,33,6,2025,5,24,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (428,40,6,2025,5,4,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (429,31,6,2025,5,12,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (430,36,6,2025,5,22,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (431,43,6,2025,5,20,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (432,42,6,2025,5,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (433,47,6,2025,5,16,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (434,45,6,2025,5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (435,20,6,2025,5,3,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (436,35,6,2025,5,20,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (437,37,6,2025,5,14,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (438,46,6,2025,5,15,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (439,39,6,2025,5,22,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (440,23,6,2025,5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (441,49,6,2025,5,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (442,38,6,2025,5,14,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (443,41,6,2025,5,5,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (444,3,6,2025,5,3,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (445,22,6,2025,5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (446,5,6,2025,5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (447,50,6,2025,5,15,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (448,8,6,2025,5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (449,48,6,2025,5,3,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (450,44,6,2025,5,17,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (451,4,7,2025,0.5,3,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (452,7,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (453,1,7,2025,0.5,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (454,16,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (455,2,7,2025,0.5,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (456,17,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (457,18,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (458,11,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (459,10,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (460,19,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (461,9,7,2025,0.5,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (462,25,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (463,21,7,2025,0.5,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (464,29,7,2025,0.5,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (465,15,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (466,28,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (467,26,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (468,27,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (469,24,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (470,14,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (471,30,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (472,6,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (473,32,7,2025,0.5,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (474,34,7,2025,0.5,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (475,12,7,2025,0.5,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (476,31,7,2025,0.5,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (477,13,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (478,36,7,2025,0.5,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (479,43,7,2025,0.5,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (480,42,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (481,45,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (482,40,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (483,20,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (484,47,7,2025,0.5,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (485,46,7,2025,0.5,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (486,39,7,2025,0.5,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (487,35,7,2025,0.5,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (488,49,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (489,37,7,2025,0.5,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (490,41,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (491,3,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (492,22,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (493,5,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (494,23,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (495,50,7,2025,0.5,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (496,38,7,2025,0.5,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (497,33,7,2025,0.5,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (498,8,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (499,48,7,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (500,44,7,2025,0.5,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (501,7,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (502,1,8,2025,0.5,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (503,4,8,2025,0.5,3,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (504,16,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (505,2,8,2025,0.5,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (506,17,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (507,10,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (508,18,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (509,9,8,2025,0.5,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (510,25,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (511,11,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (512,15,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (513,28,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (514,26,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (515,27,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (516,24,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (517,14,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (518,30,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (519,6,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (520,32,8,2025,0.5,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (521,34,8,2025,0.5,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (522,12,8,2025,0.5,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (523,31,8,2025,0.5,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (524,13,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (525,19,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (526,43,8,2025,0.5,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (527,42,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (528,21,8,2025,0.5,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (529,45,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (530,40,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (531,20,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (532,47,8,2025,0.5,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (533,46,8,2025,0.5,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (534,36,8,2025,0.5,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (535,49,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (536,29,8,2025,0.5,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (537,41,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (538,3,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (539,39,8,2025,0.5,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (540,5,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (541,35,8,2025,0.5,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (542,50,8,2025,0.5,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (543,22,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (544,38,8,2025,0.5,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (545,37,8,2025,0.5,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (546,23,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (547,33,8,2025,0.5,2,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (548,8,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (549,48,8,2025,0.5,0,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metas_metodo_comunidad" VALUES (550,44,8,2025,0.5,1,NULL,'2025-10-20 19:11:47',1);
INSERT INTO "metodos_planificacion" VALUES (1,'INY_MEN','Inyección Mensual','Iny. Mensual','hormonal','mensual','unidades',30,0,1,1,'2025-10-19 00:48:02');
INSERT INTO "metodos_planificacion" VALUES (2,'INY_BIM','Inyección Bimensual','Iny. Bimensual','hormonal','bimensual','unidades',60,0,2,1,'2025-10-19 00:48:02');
INSERT INTO "metodos_planificacion" VALUES (3,'IMPLANTE','Implante Hormonal Subdérmico','Implante','dispositivo','permanente','unidades',1095,0,6,1,'2025-10-19 00:48:02');
INSERT INTO "metodos_planificacion" VALUES (4,'CONDON_M','Condón Masculino','Condón','barrera','mensual','unidades',1,0,7,1,'2025-10-19 00:48:02');
INSERT INTO "metodos_planificacion" VALUES (5,'COLLAR','Collar del Ciclo','Collar','natural','permanente','unidades',365,0,8,1,'2025-10-19 00:48:03');
INSERT INTO "metodos_planificacion" VALUES (6,'MELA','Método de Lactancia y Amenorrea','MELA','natural','mensual','unidades',180,0,9,1,'2025-10-19 00:48:04');
INSERT INTO "metodos_planificacion" VALUES (7,'AQV_FEM','Anticoncepción Quirúrgica Voluntaria Femenina','AQV Fem','definitivo','permanente','unidades',0,0,10,1,'2025-10-19 00:48:04');
INSERT INTO "metodos_planificacion" VALUES (8,'AQV_MAS','Anticoncepción Quirúrgica Voluntaria Masculina','AQV Mas','definitivo','permanente','unidades',0,0,11,1,'2025-10-19 00:48:04');
INSERT INTO "metodos_planificacion" VALUES (9,'DIU','Dispositivo Intrauterino','DIU','dispositivo','permanente','unidades',1825,0,5,1,'2025-10-19 00:48:04');
INSERT INTO "metodos_planificacion" VALUES (10,'INY_TRI','Inyección Trimestral','Iny. Trimestral','hormonal','trimestral','unidades',90,0,3,1,'2025-10-19 00:48:04');
INSERT INTO "metodos_planificacion" VALUES (11,'PILDORA','Píldora Anticonceptiva','Píldora','hormonal','mensual','unidades',28,0,4,1,'2025-10-19 00:48:04');
INSERT INTO "municipios" VALUES (1,1,'Huehuetenango','1301',1,'2025-10-19 00:47:54');
INSERT INTO "permisos_comunidad" VALUES (6,4,5,1,1,0,'2025-10-21',1,'2025-10-21 10:11:12');
INSERT INTO "permisos_comunidad" VALUES (7,4,4,1,1,0,'2025-10-21',1,'2025-10-21 10:11:12');
INSERT INTO "permisos_comunidad" VALUES (8,4,20,1,1,0,'2025-10-21',1,'2025-10-21 10:11:12');
INSERT INTO "permisos_comunidad" VALUES (9,4,23,1,1,0,'2025-10-21',1,'2025-10-21 10:11:12');
INSERT INTO "permisos_comunidad" VALUES (10,4,21,1,1,0,'2025-10-21',1,'2025-10-21 10:11:13');
INSERT INTO "permisos_comunidad" VALUES (11,4,19,1,1,0,'2025-10-21',1,'2025-10-21 10:11:13');
INSERT INTO "permisos_comunidad" VALUES (12,4,22,1,1,0,'2025-10-21',1,'2025-10-21 10:11:13');
INSERT INTO "permisos_comunidad" VALUES (13,4,18,1,1,0,'2025-10-21',1,'2025-10-21 10:11:13');
INSERT INTO "permisos_comunidad" VALUES (14,4,2,1,1,0,'2025-10-21',1,'2025-10-21 10:11:13');
INSERT INTO "permisos_comunidad" VALUES (15,4,3,1,1,0,'2025-10-21',1,'2025-10-21 10:11:13');
INSERT INTO "permisos_comunidad" VALUES (16,4,1,1,1,0,'2025-10-21',1,'2025-10-21 10:11:13');
INSERT INTO "planificacion_mensual" VALUES (1,29,1,4,NULL,'2025-10-20 22:37:37',1,1);
INSERT INTO "planificacion_mensual" VALUES (2,29,2,4,NULL,'2025-10-20 22:37:37',1,1);
INSERT INTO "planificacion_mensual" VALUES (3,29,3,4,NULL,'2025-10-20 22:37:37',1,1);
INSERT INTO "planificacion_mensual" VALUES (4,29,4,4,NULL,'2025-10-20 22:37:37',1,1);
INSERT INTO "planificacion_mensual" VALUES (5,29,5,4,NULL,'2025-10-20 22:37:37',1,1);
INSERT INTO "planificacion_mensual" VALUES (6,29,6,4,NULL,'2025-10-20 22:37:37',1,1);
INSERT INTO "planificacion_mensual" VALUES (7,29,7,4,NULL,'2025-10-20 22:37:37',1,1);
INSERT INTO "planificacion_mensual" VALUES (8,29,8,4,NULL,'2025-10-20 22:37:37',1,1);
INSERT INTO "planificacion_mensual" VALUES (9,29,9,4,NULL,'2025-10-20 22:37:37',1,1);
INSERT INTO "planificacion_mensual" VALUES (10,29,10,4,NULL,'2025-10-20 22:37:37',1,1);
INSERT INTO "planificacion_mensual" VALUES (11,29,11,1,NULL,'2025-10-20 22:37:37',1,1);
INSERT INTO "planificacion_mensual" VALUES (12,29,12,0,NULL,'2025-10-20 22:37:37',1,1);
INSERT INTO "planificacion_mensual" VALUES (13,77,1,4,NULL,'2025-10-20 22:37:56',1,1);
INSERT INTO "planificacion_mensual" VALUES (14,77,2,4,NULL,'2025-10-20 22:37:56',1,1);
INSERT INTO "planificacion_mensual" VALUES (15,77,3,4,NULL,'2025-10-20 22:37:56',1,1);
INSERT INTO "planificacion_mensual" VALUES (16,77,4,4,NULL,'2025-10-20 22:37:56',1,1);
INSERT INTO "planificacion_mensual" VALUES (17,77,5,4,NULL,'2025-10-20 22:37:56',1,1);
INSERT INTO "planificacion_mensual" VALUES (18,77,6,4,NULL,'2025-10-20 22:37:56',1,1);
INSERT INTO "planificacion_mensual" VALUES (19,77,7,4,NULL,'2025-10-20 22:37:56',1,1);
INSERT INTO "planificacion_mensual" VALUES (20,77,8,4,NULL,'2025-10-20 22:37:56',1,1);
INSERT INTO "planificacion_mensual" VALUES (21,77,9,4,NULL,'2025-10-20 22:37:56',1,1);
INSERT INTO "planificacion_mensual" VALUES (22,77,10,4,NULL,'2025-10-20 22:37:56',1,1);
INSERT INTO "planificacion_mensual" VALUES (23,77,11,1,NULL,'2025-10-20 22:37:56',1,1);
INSERT INTO "planificacion_mensual" VALUES (24,77,12,0,NULL,'2025-10-20 22:37:56',1,1);
INSERT INTO "planificacion_mensual" VALUES (25,21,1,5,NULL,'2025-10-20 22:44:35',1,1);
INSERT INTO "planificacion_mensual" VALUES (26,21,2,5,NULL,'2025-10-20 22:44:35',1,1);
INSERT INTO "planificacion_mensual" VALUES (27,21,3,5,NULL,'2025-10-20 22:44:35',1,1);
INSERT INTO "planificacion_mensual" VALUES (28,21,4,5,NULL,'2025-10-20 22:44:35',1,1);
INSERT INTO "planificacion_mensual" VALUES (29,21,5,5,NULL,'2025-10-20 22:44:35',1,1);
INSERT INTO "planificacion_mensual" VALUES (30,21,6,5,NULL,'2025-10-20 22:44:35',1,1);
INSERT INTO "planificacion_mensual" VALUES (31,21,7,5,NULL,'2025-10-20 22:44:35',1,1);
INSERT INTO "planificacion_mensual" VALUES (32,21,8,5,NULL,'2025-10-20 22:44:35',1,1);
INSERT INTO "planificacion_mensual" VALUES (33,21,9,5,NULL,'2025-10-20 22:44:35',1,1);
INSERT INTO "planificacion_mensual" VALUES (34,21,10,5,NULL,'2025-10-20 22:44:35',1,1);
INSERT INTO "planificacion_mensual" VALUES (35,21,11,2,NULL,'2025-10-20 22:44:35',1,1);
INSERT INTO "planificacion_mensual" VALUES (36,21,12,0,NULL,'2025-10-20 22:44:35',1,1);
INSERT INTO "proyecciones_comunidad" VALUES (1,1,2025,1600,0.35,70,490,NULL,'2025-10-19 00:48:06',1,1,NULL,0,5);
INSERT INTO "proyecciones_comunidad" VALUES (2,2,2025,1150,0.35,70,332,NULL,'2025-10-19 00:48:07',1,1,333,1,7);
INSERT INTO "proyecciones_comunidad" VALUES (3,6,2025,404,0.35,70,71,NULL,'2025-10-19 00:48:07',1,1,NULL,0,5);
INSERT INTO "proyecciones_comunidad" VALUES (4,7,2025,2312,0.35,70,739,NULL,'2025-10-19 00:48:07',1,1,NULL,0,7);
INSERT INTO "proyecciones_comunidad" VALUES (5,8,2025,220,0.35,70,7,NULL,'2025-10-19 00:48:07',1,1,NULL,0,4);
INSERT INTO "proyecciones_comunidad" VALUES (6,9,2025,180,0.35,70,-7,NULL,'2025-10-19 00:48:07',1,1,5,1,3);
INSERT INTO "proyecciones_comunidad" VALUES (7,10,2025,200,0.35,70,0,NULL,'2025-10-19 00:48:07',1,1,5,1,3);
INSERT INTO "proyecciones_comunidad" VALUES (8,11,2025,150,0.35,70,-17,NULL,'2025-10-19 00:48:07',1,1,5,1,3);
INSERT INTO "proyecciones_comunidad" VALUES (9,12,2025,900,0.35,70,245,NULL,'2025-10-19 00:48:07',1,1,NULL,0,5);
INSERT INTO "proyecciones_comunidad" VALUES (10,13,2025,350,0.35,70,52,NULL,'2025-10-19 00:48:07',1,1,NULL,0,3);
INSERT INTO "proyecciones_comunidad" VALUES (11,14,2025,150,0.35,70,-17,NULL,'2025-10-19 00:48:08',1,1,5,1,3);
INSERT INTO "proyecciones_comunidad" VALUES (12,4,2025,1410,0.35,70,423,NULL,'2025-10-19 00:48:08',1,1,424,1,5);
INSERT INTO "proyecciones_comunidad" VALUES (13,16,2025,185,0.35,70,-5,NULL,'2025-10-19 00:48:08',1,1,5,1,3);
INSERT INTO "proyecciones_comunidad" VALUES (14,17,2025,200,0.35,70,0,NULL,'2025-10-19 00:48:08',1,1,5,1,3);
INSERT INTO "proyecciones_comunidad" VALUES (15,18,2025,338,0.35,70,48,NULL,'2025-10-19 00:48:08',1,1,NULL,0,7);
INSERT INTO "proyecciones_comunidad" VALUES (16,19,2025,90,0.35,70,-38,NULL,'2025-10-19 00:48:08',1,1,5,1,3);
INSERT INTO "proyecciones_comunidad" VALUES (17,20,2025,130,0.35,70,-24,NULL,'2025-10-19 00:48:08',1,1,5,1,3);
INSERT INTO "proyecciones_comunidad" VALUES (18,21,2025,85,0.35,70,-40,NULL,'2025-10-19 00:48:08',1,1,5,1,3);
INSERT INTO "proyecciones_comunidad" VALUES (19,22,2025,415,0.35,70,75,NULL,'2025-10-19 00:48:08',1,1,NULL,0,5);
INSERT INTO "proyecciones_comunidad" VALUES (20,23,2025,385,0.35,70,64,NULL,'2025-10-19 00:48:08',1,1,NULL,0,5);
INSERT INTO "proyecciones_comunidad" VALUES (21,5,2025,1700,0.35,70,525,NULL,'2025-10-19 00:48:09',1,1,NULL,0,4);
INSERT INTO "proyecciones_comunidad" VALUES (22,25,2025,100,0.35,70,-35,NULL,'2025-10-19 00:48:09',1,1,5,1,3);
INSERT INTO "proyecciones_comunidad" VALUES (23,26,2025,200,0.35,70,0,NULL,'2025-10-19 00:48:09',1,1,NULL,0,0);
INSERT INTO "proyecciones_comunidad" VALUES (24,27,2025,185,0.35,70,-5,NULL,'2025-10-19 00:48:10',1,1,5,1,3);
INSERT INTO "proyecciones_comunidad" VALUES (25,28,2025,155,0.35,70,-15,NULL,'2025-10-19 00:48:10',1,1,5,1,3);
INSERT INTO "proyecciones_comunidad" VALUES (26,29,2025,100,0.35,70,-35,NULL,'2025-10-19 00:48:10',1,1,5,1,3);
INSERT INTO "proyecciones_comunidad" VALUES (27,30,2025,270,0.35,70,24,NULL,'2025-10-19 00:48:11',1,1,NULL,0,5);
INSERT INTO "proyecciones_comunidad" VALUES (28,31,2025,124,0.35,70,-26,NULL,'2025-10-19 00:48:11',1,1,5,1,3);
INSERT INTO "proyecciones_comunidad" VALUES (29,32,2025,1400,0.35,70,419,NULL,'2025-10-19 00:48:11',1,1,NULL,0,5);
INSERT INTO "proyecciones_comunidad" VALUES (30,33,2025,459,0.35,70,90,NULL,'2025-10-19 00:48:11',1,1,NULL,0,5);
INSERT INTO "proyecciones_comunidad" VALUES (31,34,2025,900,0.35,70,245,NULL,'2025-10-19 00:48:11',1,1,NULL,0,5);
INSERT INTO "proyecciones_comunidad" VALUES (32,35,2025,1070,0.35,70,304,NULL,'2025-10-19 00:48:11',1,1,NULL,0,4);
INSERT INTO "proyecciones_comunidad" VALUES (33,36,2025,1580,0.35,70,483,NULL,'2025-10-19 00:48:11',1,1,NULL,0,6);
INSERT INTO "proyecciones_comunidad" VALUES (34,37,2025,1580,0.35,70,483,NULL,'2025-10-19 00:48:11',1,1,NULL,0,6);
INSERT INTO "proyecciones_comunidad" VALUES (35,38,2025,1400,0.35,70,419,NULL,'2025-10-19 00:48:11',1,1,NULL,0,5);
INSERT INTO "proyecciones_comunidad" VALUES (36,39,2025,1500,0.35,70,455,NULL,'2025-10-19 00:48:12',1,1,NULL,0,5);
INSERT INTO "proyecciones_comunidad" VALUES (37,40,2025,1050,0.35,70,297,NULL,'2025-10-19 00:48:12',1,1,NULL,0,8);
INSERT INTO "proyecciones_comunidad" VALUES (38,41,2025,1000,0.35,70,280,NULL,'2025-10-19 00:48:12',1,1,NULL,0,4);
INSERT INTO "proyecciones_comunidad" VALUES (39,42,2025,1500,0.35,70,455,NULL,'2025-10-19 00:48:12',1,1,NULL,0,5);
INSERT INTO "proyecciones_comunidad" VALUES (40,43,2025,460,0.35,70,91,NULL,'2025-10-19 00:48:12',1,1,NULL,0,6);
INSERT INTO "proyecciones_comunidad" VALUES (41,44,2025,500,0.35,70,105,NULL,'2025-10-19 00:48:12',1,1,NULL,0,4);
INSERT INTO "proyecciones_comunidad" VALUES (42,45,2025,300,0.35,70,35,NULL,'2025-10-19 00:48:12',1,1,NULL,0,5);
INSERT INTO "proyecciones_comunidad" VALUES (43,46,2025,1350,0.35,70,402,NULL,'2025-10-19 00:48:12',1,1,NULL,0,2);
INSERT INTO "proyecciones_comunidad" VALUES (44,47,2025,1200,0.35,70,350,NULL,'2025-10-19 00:48:13',1,1,NULL,0,3);
INSERT INTO "proyecciones_comunidad" VALUES (45,48,2025,130,0.35,70,-24,NULL,'2025-10-19 00:48:13',1,1,5,1,3);
INSERT INTO "proyecciones_comunidad" VALUES (46,49,2025,1100,0.35,70,315,NULL,'2025-10-19 00:48:13',1,1,NULL,0,6);
INSERT INTO "proyecciones_comunidad" VALUES (47,50,2025,1150,0.35,70,332,NULL,'2025-10-19 00:48:13',1,1,NULL,0,6);
INSERT INTO "proyecciones_comunidad" VALUES (48,15,2025,380,0.35,70,63,NULL,'2025-10-19 00:48:13',1,1,NULL,0,4);
INSERT INTO "proyecciones_comunidad" VALUES (49,24,2025,334,0.35,70,46,NULL,'2025-10-19 00:48:13',1,1,NULL,0,6);
INSERT INTO "proyecciones_comunidad" VALUES (50,3,2025,1100,0.35,70,315,NULL,'2025-10-19 00:48:13',1,1,NULL,0,6);
INSERT INTO "roles" VALUES (1,'auxiliar_enfermeria','Auxiliar de Enfermería','Personal de campo - registro directo',1,1,0,0,0,0,1,'2025-10-19 00:48:02');
INSERT INTO "roles" VALUES (2,'asistente_tecnico','Asistente Técnico','Supervisores territoriales - validación',2,1,1,0,1,0,1,'2025-10-19 00:48:02');
INSERT INTO "roles" VALUES (3,'encargado_sr','Encargado SR','Coordinadores con acceso completo',3,1,1,1,1,1,1,'2025-10-19 00:48:02');
INSERT INTO "roles" VALUES (4,'coordinador_municipal','Coordinador Municipal','Personal ejecutivo - vista estratégica',4,0,0,1,1,1,1,'2025-10-19 00:48:02');
INSERT INTO "territorios" VALUES (1,1,'Territorio 1','T1','Territorio 1',1,'2025-10-19 00:47:54');
INSERT INTO "territorios" VALUES (2,1,'Territorio 2','T2','Territorio 2',1,'2025-10-19 00:47:54');
INSERT INTO "territorios" VALUES (3,1,'Territorio 3','T3','Territorio 3',1,'2025-10-19 00:47:54');
INSERT INTO "territorios" VALUES (4,1,'Territorio 4','T4','Territorio 4',1,'2025-10-19 00:47:54');
INSERT INTO "territorios" VALUES (5,1,'Territorio 5','T5','Territorio 5',1,'2025-10-19 00:47:55');
INSERT INTO "territorios" VALUES (6,1,'Territorio 6','T6','Territorio 6',1,'2025-10-19 00:47:55');
INSERT INTO "territorios" VALUES (7,1,'Territorio 7','T7','Territorio 7',1,'2025-10-19 00:47:55');
INSERT INTO "territorios" VALUES (8,1,'Territorio 8','T8','Territorio 8',1,'2025-10-19 00:47:55');
INSERT INTO "territorios" VALUES (9,1,'Territorio 9','T9','Territorio 9',1,'2025-10-19 00:47:55');
INSERT INTO "user_territorios" VALUES (6,5,1,1,'2025-10-19',1,'2025-10-19 03:04:57');
INSERT INTO "user_territorios" VALUES (7,5,8,1,'2025-10-19',1,'2025-10-19 03:04:57');
INSERT INTO "user_territorios" VALUES (8,5,3,1,'2025-10-19',1,'2025-10-19 03:04:57');
INSERT INTO "user_territorios" VALUES (18,3,1,2,'2025-10-21',1,'2025-10-21 10:02:06');
INSERT INTO "user_territorios" VALUES (20,3,5,2,'2025-10-21',1,'2025-10-21 10:02:06');
INSERT INTO "usuarios" VALUES (1,'COORD001','1801199010101','Dra. María Elena','González Morales','admin@mspas.gob.gt','78901234','$2a$10$6C83ucEuCqYq.MbJeZ1v7uZnZAGAK/lyAcwkouCs3B322oel3b.LW',4,NULL,1,'Coordinadora Municipal de Salud','2025-01-01','2025-10-22 16:29:42',0,0,1,1,'2025-10-19 00:48:05','2025-10-19 00:48:05');
INSERT INTO "usuarios" VALUES (2,'ENC001','1801199020202','Dra. Rosa María','Hernández Cruz','encargado@mspas.gob.gt','78902345','$2a$10$2HLKPK1EhkypZ9tcIbtBreYOaEDl/6l7/2RIJnKH12yz.SwlXfH26',3,NULL,1,'Encargada Programa Salud Reproductiva','2025-01-01','2025-10-22 16:28:28',0,0,1,1,'2025-10-19 00:48:05','2025-10-19 00:48:05');
INSERT INTO "usuarios" VALUES (3,'ASIST001','1801199040404','Lic. Ana Patricia','Ramírez López','asist01@mspas.gob.gt','78904568','$2a$10$gP/MPXDMcFHPs3GrQHF0M.BNvwQSInneZIWFb./2etlRMNPU64TFS',2,1,1,'Asistente Técnico Territorio 1','2025-01-01','2025-10-22 16:27:43',0,0,1,1,'2025-10-19 00:48:05','2025-10-22 16:29:18');
INSERT INTO "usuarios" VALUES (4,'AUX001','1801199101010','Ana Patricia','López Morales','aux01@mspas.gob.gt','78910123','$2a$10$VvQogVd9LBTCgfT2UA9WiuO3FB1b8SROOaUynxu81ioBO2oSXeC3q',1,1,1,'Auxiliar de Enfermería','2025-01-01','2025-10-22 16:25:16',0,0,1,1,'2025-10-19 00:48:05','2025-10-21 10:11:11');
INSERT INTO "usuarios" VALUES (5,'ASIST002',NULL,'Luisa María','García Toj','luisa.toj@mspas.gob.gt',NULL,'$2a$10$7Ik9HZT7Ap1J4f2baQmOc.eNjIUvAiwT2X..x425gmUs0JWdoXNb6',2,1,NULL,NULL,'2025-10-19','2025-10-19 03:05:13',0,0,1,1,'2025-10-19 03:04:56','2025-10-19 03:04:56');
COMMIT;
