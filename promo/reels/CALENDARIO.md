# Reels: calendario y textos para publicar

Dos semanas, una pieza por día de lunes a viernes, más una el sábado de la segunda semana (11 piezas). Los archivos están en `promo/salida/` (no se suben al repositorio).

**Orden pensado:** arranca con la historia de la familia (la pieza más emotiva, para presentar la marca), y después alterna funciones del sitio y notas del blog, para que el perfil no se vea como una sola cosa repetida.

| Día | Pieza | Archivo | Duración | Tipo |
|---|---|---|---|---|
| Lun 1 | La familia que vendió sin pagar comisión | `familia.mp4` | 1 min 18 s | Historia (IA) |
| Mar 1 | El tasador | `reel-tasador.mp4` | 26 s | Función |
| Mié 1 | Cuánto pedir de alquiler | `reel-nota-alquiler-precio.mp4` | 35 s | Nota |
| Jue 1 | Publicar tu propiedad | `reel-publicar.mp4` | 24 s | Función |
| Vie 1 | Fotos que venden | `reel-nota-fotos.mp4` | 36 s | Nota |
| Lun 2 | Buscar propiedades | `reel-buscar.mp4` | 24 s | Función |
| Mar 2 | Alquilar sin inmobiliaria | `reel-nota-alquiler-sin-inmobiliaria.mp4` | 40 s | Nota |
| Mié 2 | Tu panel | `reel-panel.mp4` | 26 s | Función |
| Jue 2 | Crédito hipotecario | `reel-nota-credito-hipotecario.mp4` | 33 s | Nota |
| Vie 2 | Seña, boleto y reserva | `reel-nota-sena-boleto.mp4` | 38 s | Nota |
| Sáb 2 | Herramientas | `reel-herramientas.mp4` | 26 s | Función |

**Horario:** probá mediodía (12 a 14 h) y noche (19 a 21 h) las primeras dos semanas y quedate con el que mejor funcione en tus estadísticas. Es una hipótesis, no un dato.

**Dónde va el link:** en Instagram y TikTok no se puede enlazar desde el epígrafe. Poné `espacioinmobiliario.com.ar` en la biografía y decí "link en bio". Cada reel ya muestra la dirección en la pantalla final.

**Antes de publicar:**
- Los tres reels de notas legales y financieras (alquiler sin inmobiliaria, crédito, seña y boleto) tienen un aviso de "contenido orientativo" en la pantalla final. No lo recortes.
- El video de la familia lleva el aviso de "historia recreada con inteligencia artificial". Las redes piden marcar el contenido generado con IA: activá esa opción al subirlo.
- Esta semana hay que decidir si los textos legales se revisan con un escribano antes de difundirlos.

## Lanzamiento en Instagram: clips cortos (@espacioinmobiliario.arg)

Solo Instagram, contenido informativo, todo con IA (voz de ElevenLabs, sin personas a cámara). Sale a partir del lunes 2/11. Cada reel largo va **acompañado de un clip corto** (11 a 15 s) del mismo tema: el clip, a la noche (19 a 21 h), y el reel largo, al mediodía (12 a 14 h). Los clips se arman con el mismo motor (`node reels/render.mjs clip-<tema>`) y están en `promo/salida/reel-clip-*.mp4`.

| Fecha | Reel largo (12 a 14 h) | Clip corto (19 a 21 h) |
|---|---|---|
| Lun 2/11 | La familia (`familia.mp4`, versión liviana pendiente) | — |
| Mar 3/11 | El tasador | `reel-clip-tasador.mp4` |
| Mié 4/11 | Cuánto pedir de alquiler | `reel-clip-alquiler-precio.mp4` |
| Jue 5/11 | Publicar tu propiedad | `reel-clip-sin-comision.mp4` |
| Vie 6/11 | Fotos que venden | `reel-clip-fotos-luz.mp4` |
| Lun 9/11 | Buscar propiedades | `reel-clip-buscar.mp4` |
| Mar 10/11 | Alquilar sin inmobiliaria | `reel-clip-alquiler-escrito.mp4` |
| Mié 11/11 | Tu panel | `reel-clip-panel.mp4` |
| Jue 12/11 | Crédito hipotecario | `reel-clip-costo-financiero.mp4` |
| Vie 13/11 | Seña, boleto y reserva | `reel-clip-reserva-sena-boleto.mp4` |
| Sáb 14/11 | Herramientas | `reel-clip-herramientas.mp4` |

**Epígrafes de los clips:** el mismo del reel largo, acortado a una línea y con "Link en la bio". Los clips legales y financieros repiten el aviso de contenido orientativo.

**Medición con un solo link:** la bio tiene un único link, así que no se puede atribuir un registro a un clip. Usá `espacioinmobiliario.com.ar/?utm_source=instagram&utm_medium=bio&utm_campaign=lanzamiento` en la bio y comparás por día contra las métricas de cada pieza en Instagram (retención a 3 s, guardados, compartidos, clics en el link).

**Pendiente antes de salir:** versión liviana de `familia.mp4` (pesa 77 MB), foto de perfil y bio con el link, y decidir la revisión legal de las notas (hasta entonces, los clips de seña, crédito y alquiler sin inmobiliaria se pueden mover al final).

---

## 1. La familia que vendió sin pagar comisión (Lun 1)

**Epígrafe**
> No podían pagar una comisión alta. Vendieron por su cuenta, pero no solos.
> Una historia recreada con IA sobre vender de forma independiente, con acompañamiento humano y legal. 🏠
> Más en el link de la bio.

**Hashtags:** #espacioinmobiliario #vendersincomision #dueñodirecto #inmobiliaria #propiedades #buenosaires #historia

**Nota:** versión liviana pendiente (pesa 77 MB). Pedir que la comprima antes de subirla desde el celular.

## 2. El tasador (Mar 1)

**Epígrafe**
> ¿Cuánto vale tu departamento? Averigualo gratis, en cinco pasos y en segundos.
> Elegís el barrio, cargás los datos y listo: una estimación con datos reales del mercado. Es orientativa, para que arranques con un número.
> Link en la bio.

**Hashtags:** #tasacion #cuantovaletupropiedad #departamentos #caba #inmuebles #espacioinmobiliario

**Comentario fijado:** "Es una estimación orientativa. Si querés revisarla con una persona, escribinos."

## 3. Cuánto pedir de alquiler (Mié 1)

**Epígrafe**
> Poner precio a un alquiler parece fácil hasta que lo publicás. Tres reglas para llegar a un número defendible:
> 1️⃣ Empezá por comparables
> 2️⃣ Ajustá por lo que distingue a tu propiedad
> 3️⃣ Revisalo una vez por año
> La nota completa, en el blog (link en la bio).

**Hashtags:** #alquiler #propietarios #preciodealquiler #inversioninmobiliaria #caba #espacioinmobiliario

## 4. Publicar tu propiedad (Jue 1)

**Epígrafe**
> ¿Querés vender sin pagar comisión? Publicar lleva unos minutos: cargás los datos, marcás la ubicación en el mapa, subís las fotos y una IA te ayuda con la descripción.
> Publicá gratis. Link en la bio.

**Hashtags:** #vendertupropiedad #dueñodirecto #sincomision #publicargratis #inmuebles #espacioinmobiliario

## 5. Fotos que venden (Vie 1)

**Epígrafe**
> La foto es lo primero que ve un comprador. No hace falta una cámara profesional:
> ✔️ Ordená y limpiá antes de sacar
> ✔️ Aprovechá la luz natural, sin flash
> ✔️ Cuidá el encuadre: horizontal, a la altura del pecho, desde la esquina
> Guía completa en el blog (link en la bio).

**Hashtags:** #fotografiainmobiliaria #vender #consejos #homestaging #propiedades #espacioinmobiliario

## 6. Buscar propiedades (Lun 2)

**Epígrafe**
> Buscá propiedad directo con su dueño. Filtrás por tipo, zona, dormitorios y precio, y ves si es apto crédito. Y le escribís sin intermediarios.
> Link en la bio.

**Hashtags:** #comprarpropiedad #departamentoenventa #aptocredito #caba #inmuebles #espacioinmobiliario

## 7. Alquilar sin inmobiliaria (Mar 2)

**Epígrafe**
> Alquilar sin inmobiliaria te ahorra la comisión, pero te deja una tarea. Tres cosas para hacerla bien:
> 1️⃣ Elegí bien al inquilino
> 2️⃣ Definí la garantía
> 3️⃣ Dejá todo por escrito
> Contenido orientativo: consultá con un profesional. Guía completa en el blog.

**Hashtags:** #alquilar #propietarios #contratodealquiler #garantia #inquilinos #espacioinmobiliario

## 8. Tu panel (Mié 2)

**Epígrafe**
> Una vez publicado, todo tu aviso en un solo lugar: seguís las consultas, agendás las visitas, y pausás o actualizás tu publicación cuando quieras. Y validás tu identidad para ganar la confianza de los compradores.
> Link en la bio.

**Hashtags:** #propietarios #gestioninmobiliaria #vendertupropiedad #inmuebles #espacioinmobiliario

## 9. Crédito hipotecario (Jue 2)

**Epígrafe**
> Antes de pedir un crédito hipotecario, tres cosas para mirar:
> 1️⃣ El banco evalúa tus ingresos y la propiedad
> 2️⃣ Mirá el costo financiero total, no solo la tasa
> 3️⃣ Ojo con el ajuste por inflación
> Contenido orientativo: consultá con tu banco. Nota completa en el blog.

**Hashtags:** #creditohipotecario #comprartuprimerpropiedad #cft #financiacion #inmuebles #espacioinmobiliario

## 10. Seña, boleto y reserva (Vie 2)

**Epígrafe**
> Reserva, seña y boleto no son lo mismo, y confundirlos es uno de los errores más caros de una compra.
> 🔹 La reserva saca la propiedad del mercado
> 🔹 La seña confirma el trato
> 🔹 El boleto te obliga a comprar
> Contenido orientativo: consultá con un escribano. Nota completa en el blog.

**Hashtags:** #compraventa #boleto #seña #escribano #comprarunacasa #espacioinmobiliario

## 11. Herramientas (Sáb 2)

**Epígrafe**
> Espacio Inmobiliario es más que avisos: es información para decidir mejor. Un blog con guías para comprar, vender y alquilar, la calculadora de aranceles del Registro de la Propiedad, y un foro para preguntar y debatir.
> Todo gratis. Link en la bio.

**Hashtags:** #inmobiliaria #calculadora #blog #foro #propiedades #espacioinmobiliario

---

## Después de publicar

- Mirá qué pieza retiene más tiempo y repetí ese formato.
- Si las funciones funcionan mejor que las notas (o al revés), la segunda tanda se arma con más de ese tipo.
- Se puede hacer un reel nuevo en menos de una hora: ver `promo/README.md`, sección "Reels".
