import csv
import json
import os
from openai import OpenAI
from dotenv import load_dotenv

# Cargar .env desde la misma carpeta del script (camideambiente)
_script_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(_script_dir, ".env"))
load_dotenv()

api_key = os.getenv("DEEPSEEK_API_KEY") or os.getenv("OPENAI_API_KEY")
if not api_key:
    raise SystemExit(
        "❌ Falta la API key. Crea un archivo .env en la carpeta camideambiente con:\n"
        "   OPENAI_API_KEY=sk-tu-key-de-deepseek"
    )

client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")

# Archivos y límite para la prueba
ARCHIVO_CSV = "commentsPopularPosts.csv"
ARCHIVO_SALIDA = "resultados_analisis.json"
LIMITE_COMENTARIOS = None  # None = analizar todos los comentarios


def analizar_con_ia(texto_completo, comentario_original):
    """Envía el texto a DeepSeek y devuelve el análisis en JSON."""
    try:
        respuesta = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {
                    "role": "system",
                    "content": """
                    Eres un analista de Instagram. Devuelve los resultados EN FORMATO JSON con:
                    - sentiment (POSITIVO/NEGATIVO/NEUTRO)
                    - top_keywords (lista de 5 palabras clave)
                    - top_emojis (lista de 3 emojis)
                    - engagement_score (número del 0 al 100)
                    - summary (análisis breve)
                    - comentario_analizado (el texto original analizado)
                    """
                },
                {"role": "user", "content": texto_completo}
            ],
            response_format={"type": "json_object"}
        )
        resultado = json.loads(respuesta.choices[0].message.content)
        resultado["comentario_analizado"] = comentario_original
        return resultado
    except Exception as e:
        print(f"  ⚠️ Error en API: {e}")
        return {
            "error": str(e),
            "comentario_analizado": comentario_original
        }


def analizar_csv(archivo_csv, archivo_salida, limite=None):
    """
    Lee commentsPopularPosts.csv, analiza cada comentario y guarda los resultados.
    limite: solo analizar los primeros N comentarios (None = todos).
    """
    resultados = []
    script_dir = os.path.dirname(os.path.abspath(__file__))
    ruta_csv = os.path.join(script_dir, "csvjson", archivo_csv)
    ruta_salida = os.path.join(script_dir, archivo_salida)

    if not os.path.exists(ruta_csv):
        print(f"❌ No se encontró el archivo: {ruta_csv}")
        return

    print(f"📄 Leyendo {archivo_csv}...")

    with open(ruta_csv, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []
        if "text" not in fieldnames:
            print("❌ El archivo CSV debe tener una columna 'text'")
            return

        filas = list(reader)
        total = len(filas)
        max_a_procesar = min(limite, total) if limite else total
        print(f"🔍 Comentarios en el CSV: {total}. Se analizarán: {max_a_procesar}")

        procesados = 0
        for i, fila in enumerate(filas):
            if limite and procesados >= limite:
                break

            comentario = (fila.get("text") or "").strip()
            if not comentario:
                continue

            procesados += 1
            print(f"  Progreso: {procesados}/{max_a_procesar} – @{fila.get('ownerUsername', '?')}")

            texto_para_ia = f"COMENTARIO: {comentario}"

            analisis = analizar_con_ia(texto_para_ia, comentario)

            resultado_final = {
                "comentario": comentario,
                "analisis": analisis,
                "metadata": {
                    "id": fila.get("id", ""),
                    "usuario": fila.get("ownerUsername", ""),
                    "fecha": fila.get("timestamp", ""),
                    "url_post": fila.get("postUrl", "")
                }
            }
            resultados.append(resultado_final)

    with open(ruta_salida, "w", encoding="utf-8") as f:
        json.dump(resultados, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Análisis completado. Resultados guardados en {archivo_salida}")


if __name__ == "__main__":
    analizar_csv(ARCHIVO_CSV, ARCHIVO_SALIDA, limite=LIMITE_COMENTARIOS)
