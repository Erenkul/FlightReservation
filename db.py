import cx_Oracle

# Kendi Oracle bilgilerini buraya gir
# Eğer Oracle XE kullanıyorsan genelde service_name='XE' olur.
def get_connection():
    try:
        dsn = cx_Oracle.makedsn("localhost", 1521, service_name="XE")
        conn = cx_Oracle.connect(user="SYSTEM", password="your_password", dsn=dsn)
        return conn
    except cx_Oracle.Error as e:
        print(f"Veritabanı bağlantı hatası: {e}")
        return None