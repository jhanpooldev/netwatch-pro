import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/redes")

client = MongoClient(MONGODB_URI)
# Obtener la base de datos por defecto (o 'redes' si no viene especificada)
db = client.get_default_database()
if db is None or db.name == 'test':
    db = client['redes']

print(f"PyMongo conectado a la base de datos: {db.name}")

# Colecciones
usuarios_col = db['usuarios']
dispositivos_col = db['dispositivos']
incidencias_col = db['incidencias']
alertas_col = db['alertas']
configuracion_col = db['configuracion']
