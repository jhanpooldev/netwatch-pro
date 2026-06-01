from datetime import datetime, timezone
from app.database import usuarios_col, dispositivos_col
from app.auth import hash_password

def sembrar_datos():
    try:
        count = usuarios_col.count_documents({})
        if count > 0:
            print("Info: La base de datos ya tiene datos. Seeding omitido.")
            return

        print("Sembrando datos iniciales...")

        usuarios = [
            {
                "nombre": "Administrador",
                "correo": "admin@netwatch.com",
                "password_hash": hash_password("Admin1234!"),
                "rol": "admin",
                "activo": True,
                "ultimo_acceso": None,
                "created_at": datetime.now(timezone.utc)
            },
            {
                "nombre": "Técnico TI",
                "correo": "tecnico@netwatch.com",
                "password_hash": hash_password("Tecnico1234!"),
                "rol": "tecnico",
                "activo": True,
                "ultimo_acceso": None,
                "created_at": datetime.now(timezone.utc)
            },
            {
                "nombre": "Gerente TI",
                "correo": "gerente@netwatch.com",
                "password_hash": hash_password("Gerente1234!"),
                "rol": "observador",
                "activo": True,
                "ultimo_acceso": None,
                "created_at": datetime.now(timezone.utc)
            }
        ]
        usuarios_col.insert_many(usuarios)

        dispositivos = [
            {
                "nombre": "Router Principal",
                "ip_address": "8.8.8.8",
                "mac_address": "",
                "tipo": "router",
                "ubicacion": "Sala de Servidores - Rack A1",
                "estado": "sin_monitoreo",
                "latencia_actual": None,
                "intervalo_ping": 60,
                "ultima_verificacion": None,
                "uptime_porcentaje": 100,
                "created_at": datetime.now(timezone.utc)
            },
            {
                "nombre": "Switch Distribución",
                "ip_address": "1.1.1.1",
                "mac_address": "",
                "tipo": "switch",
                "ubicacion": "Piso 2 - Closet de Red",
                "estado": "sin_monitoreo",
                "latencia_actual": None,
                "intervalo_ping": 60,
                "ultima_verificacion": None,
                "uptime_porcentaje": 100,
                "created_at": datetime.now(timezone.utc)
            },
            {
                "nombre": "Servidor Web",
                "ip_address": "208.67.222.222",
                "mac_address": "",
                "tipo": "servidor",
                "ubicacion": "Centro de Datos",
                "estado": "sin_monitoreo",
                "latencia_actual": None,
                "intervalo_ping": 60,
                "ultima_verificacion": None,
                "uptime_porcentaje": 100,
                "created_at": datetime.now(timezone.utc)
            },
            {
                "nombre": "Servidor DB",
                "ip_address": "9.9.9.9",
                "mac_address": "",
                "tipo": "servidor",
                "ubicacion": "Centro de Datos",
                "estado": "sin_monitoreo",
                "latencia_actual": None,
                "intervalo_ping": 60,
                "ultima_verificacion": None,
                "uptime_porcentaje": 100,
                "created_at": datetime.now(timezone.utc)
            },
            {
                "nombre": "Firewall Perimetral",
                "ip_address": "8.8.4.4",
                "mac_address": "",
                "tipo": "router",
                "ubicacion": "Sala de Servidores - Rack A2",
                "estado": "sin_monitoreo",
                "latencia_actual": None,
                "intervalo_ping": 60,
                "ultima_verificacion": None,
                "uptime_porcentaje": 100,
                "created_at": datetime.now(timezone.utc)
            }
        ]
        dispositivos_col.insert_many(dispositivos)
        
        print("Datos iniciales sembrados correctamente.")
        print("  admin@netwatch.com / Admin1234!")
        print("  tecnico@netwatch.com / Tecnico1234!")
        print("  gerente@netwatch.com / Gerente1234!")
    except Exception as e:
        print(f"Error sembrando datos: {e}")
