import cx_Oracle
import os

# Basit bir session pool ile tekrar kullanılabilir bağlantı
_POOL = None


def _ensure_pool():
    global _POOL
    if _POOL:
        return _POOL

    user = os.getenv("ORACLE_USER", "SYSTEM")
    password = os.getenv("ORACLE_PASSWORD", "hr")
    host = os.getenv("ORACLE_HOST", "localhost")
    port = int(os.getenv("ORACLE_PORT", "1521"))
    service = os.getenv("ORACLE_SERVICE", "XE")

    dsn = cx_Oracle.makedsn(host, port, service_name=service)

    # Pool değerleri küçük tutuldu; gereksinime göre güncellenebilir
    _POOL = cx_Oracle.SessionPool(
        user=user,
        password=password,
        dsn=dsn,
        min=1,
        max=5,
        increment=1,
        threaded=True,
        getmode=cx_Oracle.SPOOL_ATTRVAL_WAIT,
    )
    return _POOL


def get_connection():
    try:
        pool = _ensure_pool()
        return pool.acquire()
    except cx_Oracle.Error as e:
        print(f"Veritabanı bağlantı hatası: {e}")
        return None