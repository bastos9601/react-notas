import sqlite3

def consultar_tablas():
    conn = sqlite3.connect('sistema_notas.db')
    cursor = conn.cursor()
    
    # Listar todas las tablas
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tablas = cursor.fetchall()
    
    print("Tablas en la base de datos:")
    for tabla in tablas:
        print(f"- {tabla[0]}")
        
    # Mostrar algunos datos de ejemplo
    for tabla in tablas:
        nombre_tabla = tabla[0]
        try:
            print(f"\nContenido de la tabla '{nombre_tabla}' (primeros 5 registros):")
            cursor.execute(f"SELECT * FROM {nombre_tabla} LIMIT 5")
            columnas = [descripcion[0] for descripcion in cursor.description]
            print(" | ".join(columnas))
            print("-" * 80)
            
            filas = cursor.fetchall()
            if filas:
                for fila in filas:
                    print(" | ".join(str(valor) for valor in fila))
            else:
                print("(Tabla vacía)")
        except Exception as e:
            print(f"Error al consultar la tabla {nombre_tabla}: {e}")
    
    conn.close()

if __name__ == "__main__":
    consultar_tablas()