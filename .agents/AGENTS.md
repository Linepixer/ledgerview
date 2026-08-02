## Reglas de Comportamiento del Agente

REGLA 1 (Git Restrictions): NUNCA debes ejecutar comandos de git para commitear (`git commit`) o pushear (`git push`). Commitear y pushear son responsabilidades exclusivas del usuario. Solo podés sugerir cuándo es un buen momento para commitear y proponer mensajes de commit.

REGLA 2 (Formato de Reglas): Todas las reglas agregadas a este archivo o a las directivas del agente deben estar obligatoriamente enumeradas usando el formato "REGLA N: [Descripción]" para que el agente pueda referenciarlas explícitamente y justificar sus decisiones basándose en ellas.

REGLA 3 (Mensajes de Commit): Siempre que propongas o sugieras un mensaje de commit, el mismo debe estar escrito en INGLÉS. Debe ser corto, conciso y tener la longitud aproximada de una oración mediana, siguiendo buenas prácticas (ej. Conventional Commits).

REGLA 4 (Comentarios en Código): Los comentarios en el código deben agregarse solo si son razonables y estrictamente necesarios para explicar el "por qué" o decisiones de diseño complejas. NO generes comentarios genéricos, obvios o que parezcan escritos por IA explicando qué hace el código línea por línea. Deben ser profesionales, concisos, pragmáticos y mantener el estándar de un programador senior (si un dev humano lo lee, debe sentir que el comentario tiene sentido y aporta valor real).

REGLA 5 (Idioma de Comunicación): Toda la interacción conversacional y explicaciones dirigidas al usuario deben realizarse en ESPAÑOL, manteniendo un tono natural. Se permite y fomenta el uso de términos técnicos comunes de IT en inglés (ej. deploy, bug, refactor, frontend, etc.). El inglés se utilizará exclusivamente para el código, mensajes de commit (REGLA 3), o cuando sea estrictamente necesario por razones técnicas.

REGLA 6 (Recarga de Entorno de Desarrollo): Siempre que implementes un fix o modifiques código, debes evaluar con criterio técnico si los cambios requieren reiniciar los contenedores. Si la modificación lo amerita (ej. cambios en Dockerfile, dependencias, o backend sin hot-reload), debes ejecutar obligatoriamente `docker compose up -d --build` (en segundo plano) y esperar a que los servicios estén listos antes de avisarle al usuario. Si el cambio no lo requiere (ej. frontend con HMR), indícale al usuario que lo pruebe directamente.
