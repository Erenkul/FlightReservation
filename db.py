import os
import cx_Oracle
from dotenv import load_dotenv

load_dotenv()

# BURADA init_oracle_client OLMAMALI (app.py'ye taşıdık)
# 🔌 Bağlantı Fonksiyonu

# ----------------------------------------------------------------------

def get_connection():

    """

    Veritabanına bağlantı kurar ve bağlantı nesnesini döndürür.

    """
    user = os.getenv("ORA_USER")
    password = os.getenv("ORA_PASSWORD")
    host = os.getenv("ORA_HOST")
    port = os.getenv("ORA_PORT")
    service = os.getenv("ORA_SERVICE")

    dsn = cx_Oracle.makedsn(host, port, service_name=service)
    conn = cx_Oracle.connect(user=user, password=password, dsn=dsn)
    return conn
# ----------------------------------------------------------------------

# 📄 Tüm kayıtları döndür (SELECT çoklu sonuçlar)

# ----------------------------------------------------------------------

def query_all(sql, params=None):

    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute(sql, params or [])
        cols = [d[0].upper() for d in cur.description]
        data = [dict(zip(cols, row)) for row in cur.fetchall()]
        return data

# ----------------------------------------------------------------------

# 📄 Tek bir kayıt döndür (ör. detay sayfaları için)

# ----------------------------------------------------------------------

def query_one(sql, params=None):
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute(sql, params or [])
        row = cur.fetchone()
        return row
# ----------------------------------------------------------------------

# ✏️ Veri ekleme, silme, güncelleme (INSERT / UPDATE / DELETE)

# ----------------------------------------------------------------------

def execute(sql, params=None):

    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute(sql, params or [])
        conn.commit()